import { ValidationError } from 'yup';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ValidationError) {
    const messages = [...new Set(error.errors)];
    return res.status(400).json({ error: messages.join(', ') });
  }
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors || {}).map((item) => item.message);
    return res.status(400).json({ error: messages.join(', ') || error.message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid resource id' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: 'That record already exists' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body contains invalid JSON' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Attachment must be 5 MB or smaller' });
  }
  if (typeof error.code === 'string' && error.code.startsWith('LIMIT_')) {
    return res.status(400).json({ error: 'Invalid attachment upload' });
  }

  if (process.env.NODE_ENV !== 'production') console.error(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status < 500 ? error.message : 'Something went wrong';
  return res.status(status).json({ error: message });
}
