import { HttpError } from '../utils/http-error.js';

export function getJwtSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new HttpError(500, 'JWT_SECRET must be set to at least 32 characters');
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export const getCookieName = () => process.env.COOKIE_NAME || 'bookleaf_token';

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  };
}
