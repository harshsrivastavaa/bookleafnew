import * as yup from 'yup';
import { AiServiceError } from '../services/ai.service.js';
import {
  addReply, createDraft, createTicket, getTicket, getTicketAttachment, listTickets, updateTicket,
} from '../services/ticket.service.js';

const createTicketSchema = yup.object({
  bookId: yup.string().default('GENERAL'),
  subject: yup.string().trim().min(4).max(140).required(),
  description: yup.string().trim().min(10).max(5000).required(),
});
const messageSchema = yup.object({ body: yup.string().trim().min(1).max(10000).required() });
const updateTicketSchema = yup.object({
  status: yup.string().oneOf(['Open', 'In Progress', 'Waiting on Author', 'Resolved', 'Closed']),
  priority: yup.string().oneOf(['Critical', 'Low', 'Medium', 'High', 'Urgent']),
  category: yup.string().oneOf([
    'Royalties & Payments', 'ISBN & Metadata Issues', 'Printing & Quality',
    'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry',
    'Book Distribution', 'Publishing Process', 'Technical Support', 'Marketing & Promotion', 'Other',
  ]),
  assignedTo: yup.string().nullable(),
}).noUnknown().test('at-least-one-field', 'Provide at least one ticket field to update', (value) => Object.keys(value || {}).length > 0);

export async function list(req, res) {
  return res.json(await listTickets(req.user, req.query));
}

export async function create(req, res) {
  const input = await createTicketSchema.validate(req.body, { abortEarly: false });
  return res.status(201).json({ ticket: await createTicket(req.user, input, req.file) });
}

export async function attachment(req, res) {
  const file = await getTicketAttachment(req.params.id, req.user);
  res.set({
    'Content-Type': file.mimeType,
    'Content-Length': file.size,
    'Content-Disposition': `attachment; filename="${file.fileName.replace(/["\\\r\n]/g, '_')}"`,
    'X-Content-Type-Options': 'nosniff',
  });
  return res.send(file.data);
}

export async function getById(req, res) {
  return res.json({ ticket: await getTicket(req.params.id, req.user) });
}

export async function reply(req, res) {
  const { body } = await messageSchema.validate(req.body, { abortEarly: false });
  return res.status(201).json({ ticket: await addReply(req.params.id, req.user, body) });
}

export async function update(req, res) {
  const input = await updateTicketSchema.validate(req.body, { abortEarly: false });
  return res.json({ ticket: await updateTicket(req.params.id, input) });
}

export async function addNote(req, res) {
  const { body } = await messageSchema.validate(req.body, { abortEarly: false });
  return res.status(201).json({ ticket: await addReply(req.params.id, req.user, body, true) });
}

export async function draft(req, res) {
  try {
    const generatedDraft = await createDraft(req.params.id);
    return res.json({ draft: generatedDraft });
  } catch (error) {
    if (!(error instanceof AiServiceError)) throw error;
    return res.status(error.status).json({
      error: error.message,
      code: error.code,
      retryable: error.retryable,
    });
  }
}
