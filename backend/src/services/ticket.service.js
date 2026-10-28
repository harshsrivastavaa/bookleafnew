import mongoose from 'mongoose';
import { Author, Ticket, User } from '../models/index.js';
import { AiServiceError, classifyTicket, draftReply, logAiDebug } from './ai.service.js';
import { HttpError } from '../utils/http-error.js';

const OPEN_STATUSES = ['Open', 'In Progress', 'Waiting on Author'];
const CLOSED_STATUSES = ['Resolved', 'Closed'];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function ticketView(ticket, isAdmin = false) {
  const data = ticket.toObject ? ticket.toObject() : { ...ticket };
  if (!isAdmin) data.messages = data.messages.filter((message) => !message.internal);
  if (data.attachment) delete data.attachment.data;
  return data;
}

export async function getBooks(user, authorId) {
  if (user.role === 'admin' && !authorId) {
    const authors = await Author.find({}, 'authorId name email books');
    return authors.flatMap((author) => author.books.map((book) => ({
      ...book.toObject(),
      author: { id: author.id, authorId: author.authorId, name: author.name, email: author.email },
    })));
  }
  const author = user.role === 'admin' && authorId
    ? await Author.findById(authorId)
    : user.author;
  if (user.role === 'author' && !author) throw new HttpError(404, 'Author profile not found');
  return author ? author.books : Author.find({}, 'name email books');
}

export async function getDashboard(user) {
  if (user.role === 'admin') {
    const [total, open, urgent, authors] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: OPEN_STATUSES } }),
      Ticket.countDocuments({ priority: { $in: ['Critical', 'Urgent'] }, status: { $nin: CLOSED_STATUSES } }),
      Author.countDocuments(),
    ]);
    return { total, open, urgent, authors };
  }
  const author = user.author;
  const tickets = await Ticket.find({ author: author?._id });
  const books = author?.books || [];
  return {
    books: books.length,
    tickets: tickets.length,
    openTickets: tickets.filter((ticket) => !CLOSED_STATUSES.includes(ticket.status)).length,
    totalRoyalties: books.reduce((total, book) => total + (book.totalRoyaltyEarned || 0), 0),
    pendingRoyalties: books.reduce((total, book) => total + (book.royaltyPending || 0), 0),
  };
}

export async function listTickets(user, query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const filter = {};
  if (user.role === 'author') {
    filter.author = user.author?._id;
  } else {
    for (const field of ['status', 'priority', 'category']) {
      if (query[field]) filter[field] = query[field];
    }
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
    }
    if (query.q) {
      const search = new RegExp(escapeRegex(String(query.q)), 'i');
      filter.$or = [{ ticketNumber: search }, { subject: search }];
    }
  }
  const [tickets, total] = await Promise.all([
    Ticket.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('author', 'name email').populate('assignedTo', 'name'),
    Ticket.countDocuments(filter),
  ]);
  return {
    tickets: tickets.map((ticket) => ticketView(ticket, user.role === 'admin')),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function createTicket(user, input, uploadedFile, classify = classifyTicket) {
  const author = user.author;
  if (!author) throw new HttpError(404, 'Author profile not found');
  if (input.bookId !== 'GENERAL' && !author.books.some((book) => book.bookId === input.bookId)) {
    throw new HttpError(400, 'Choose one of your books');
  }

  const ticketNumber = `BL-${String(Date.now()).slice(-6)}-${new mongoose.Types.ObjectId().toString().slice(-6)}`;
  const ticket = await Ticket.create({
    ticketNumber,
    author: author._id,
    bookId: input.bookId,
    subject: input.subject,
    description: input.description,
    category: 'General Inquiry',
    priority: 'Medium',
    messages: [{ sender: user._id, senderRole: 'author', body: input.description }],
    ...(uploadedFile ? { attachment: {
      fileName: uploadedFile.originalname,
      mimeType: uploadedFile.mimetype,
      size: uploadedFile.size,
      data: uploadedFile.buffer,
    } } : {}),
  });

  if (process.env.GEMINI_API_KEY) {
    void classify(input.subject, input.description)
      .then(async (ai) => {
        logAiDebug('ticket classification persistence started', {
          ticketNumber: ticket.ticketNumber,
          category: ai.category,
          priority: ai.priority,
        });
        const updatedTicket = await Ticket.findByIdAndUpdate(ticket._id, {
          category: ai.category,
          priority: ai.priority,
          ai,
        }, { new: true });

        if (!updatedTicket) {
          console.error(`[AI] classification was generated but ticket ${ticket.ticketNumber} was not found for update`);
          return;
        }
        logAiDebug('ticket classification saved to MongoDB', {
          ticketNumber: updatedTicket.ticketNumber,
          ai: updatedTicket.ai,
        });
      })
      .catch((error) => {
        if (error instanceof AiServiceError) return;
        console.error('[AI] ticket classification persistence failed', {
          errorName: error?.name || 'UnknownError',
          errorCode: error?.code || 'UNKNOWN',
        });
      });
  }
  return ticketView(ticket);
}

export async function getTicketAttachment(id, user) {
  const ticket = await Ticket.findById(id).select('+attachment.data');
  if (!ticket || (user.role === 'author' && String(ticket.author) !== String(user.author?._id))) {
    throw new HttpError(404, 'Attachment not found');
  }
  if (!ticket.attachment) throw new HttpError(404, 'Attachment not found');
  return ticket.attachment;
}

export async function getTicket(id, user) {
  const ticket = await Ticket.findById(id).populate('author', 'name email').populate('assignedTo', 'name');
  if (!ticket || (user.role === 'author' && String(ticket.author._id) !== String(user.author?._id))) {
    throw new HttpError(404, 'Ticket not found');
  }
  return ticketView(ticket, user.role === 'admin');
}

async function findAccessibleTicket(id, user) {
  const ticket = await Ticket.findById(id);
  if (!ticket || (user.role === 'author' && String(ticket.author) !== String(user.author?._id))) {
    throw new HttpError(404, 'Ticket not found');
  }
  return ticket;
}

export async function addReply(id, user, body, internal = false) {
  const ticket = await findAccessibleTicket(id, user);
  ticket.messages.push({ sender: user._id, senderRole: user.role, body, internal });
  if (!internal && user.role === 'author' && ticket.status === 'Waiting on Author') ticket.status = 'In Progress';
  await ticket.save();
  return ticketView(ticket, user.role === 'admin');
}

export async function updateTicket(id, input) {
  if (input.assignedTo && !await User.exists({ _id: input.assignedTo, role: 'admin' })) {
    throw new HttpError(400, 'Invalid assignee');
  }
  const ticket = await Ticket.findByIdAndUpdate(id, input, { new: true, runValidators: true })
    .populate('assignedTo', 'name');
  if (!ticket) throw new HttpError(404, 'Ticket not found');
  return ticketView(ticket, true);
}

export async function createDraft(id, generateDraft = draftReply) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new HttpError(404, 'Ticket not found');
  return generateDraft(ticket);
}
