import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { User } from '../models/index.js';
import { getJwtSecret } from '../config/auth.js';
import { HttpError } from '../utils/http-error.js';

export async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+passwordHash')
    .populate('author');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Email or password is incorrect');
  }

  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getJwtSecret());
  return { user, token };
}

export function toUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    authorId: user.author?.id,
  };
}
