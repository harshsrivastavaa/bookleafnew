import { HttpError } from '../utils/http-error.js';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

export function verifyRequestOrigin(req, res, next) {
  if (MUTATING_METHODS.has(req.method) && req.get('X-Requested-With') !== 'XMLHttpRequest') {
    return next(new HttpError(403, 'Request verification failed'));
  }
  return next();
}
