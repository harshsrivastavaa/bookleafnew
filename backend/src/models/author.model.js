import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const bookSchema = new Schema({
  bookId: { type: String, required: true },
  title: { type: String, required: true },
  isbn: String,
  genre: String,
  publicationDate: Date,
  status: { type: String, required: true },
  mrp: Number,
  authorRoyaltyPerCopy: Number,
  totalCopiesSold: { type: Number, default: 0 },
  totalRoyaltyEarned: { type: Number, default: 0 },
  royaltyPaid: { type: Number, default: 0 },
  royaltyPending: { type: Number, default: 0 },
  lastRoyaltyPayoutDate: Date,
  printPartner: String,
  availableOn: { type: [String], default: [] },
}, { _id: false });

const authorSchema = new Schema({
  authorId: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  phone: String,
  city: String,
  joinedDate: Date,
  books: { type: [bookSchema], default: [] },
}, { timestamps: true });

export const Author = model('Author', authorSchema);
