import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import bookRoutes from './routes/books.routes.js';
import ticketRoutes from './routes/tickets.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { verifyRequestOrigin } from './middleware/request.middleware.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(verifyRequestOrigin);
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api', bookRoutes);
app.use('/api', ticketRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
