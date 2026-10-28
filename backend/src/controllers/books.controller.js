import { User } from '../models/index.js';
import { getBooks, getDashboard } from '../services/ticket.service.js';

export async function listBooks(req, res) {
  return res.json({ books: await getBooks(req.user, req.query.authorId) });
}

export async function listAdmins(req, res) {
  return res.json({ admins: await User.find({ role: 'admin' }, 'name email') });
}

export async function getDashboardData(req, res) {
  return res.json(await getDashboard(req.user));
}
