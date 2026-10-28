import { jwtVerify } from 'jose';
import { User } from '../models/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';
import { getCookieName, getJwtSecret } from '../config/auth.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies[getCookieName()];
  if (!token) throw new HttpError(401, 'Authentication required');

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const user = await User.findById(payload.sub).populate('author');
    if (!user) throw new Error('Session expired');
    req.user = user;
  } catch {
    throw new HttpError(401, 'Session expired');
  }
  return next();
});

export function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, 'Forbidden'));
    }
    return next();
  };
}
