import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['author', 'admin'], required: true },
  author: { type: Schema.Types.ObjectId, ref: 'Author', default: null },
  name: { type: String, required: true },
}, { timestamps: true });

export const User = model('User', userSchema);
