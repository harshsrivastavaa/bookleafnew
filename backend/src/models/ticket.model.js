import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const messageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['author', 'admin', 'system'], required: true },
  body: { type: String, required: true, maxlength: 10000 },
  internal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const attachmentSchema = new Schema({
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  data: { type: Buffer, required: true, select: false },
}, { _id: false });

const ticketSchema = new Schema({
  ticketNumber: { type: String, unique: true, index: true },
  author: { type: Schema.Types.ObjectId, ref: 'Author', required: true, index: true },
  bookId: { type: String, required: true },
  subject: { type: String, required: true, maxlength: 140 },
  description: { type: String, required: true, maxlength: 5000 },
  category: {
    type: String,
    enum: ['Royalties & Payments', 'ISBN & Metadata Issues', 'Printing & Quality', 'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry', 'Book Distribution', 'Publishing Process', 'Technical Support', 'Marketing & Promotion', 'Other'],
    default: 'General Inquiry',
  },
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low', 'Urgent'], default: 'Medium' },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Waiting on Author', 'Resolved', 'Closed'],
    default: 'Open',
    index: true,
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  ai: { type: Schema.Types.Mixed, default: null },
  attachment: { type: attachmentSchema, default: null },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

ticketSchema.index({ author: 1, updatedAt: -1 });
ticketSchema.index({ status: 1, priority: 1, updatedAt: -1 });

export const Ticket = model('Ticket', ticketSchema);
