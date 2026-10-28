import * as yup from 'yup';
import { getCookieName, getCookieOptions } from '../config/auth.js';
import { login, toUserResponse } from '../services/auth.service.js';

const loginSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

export async function loginUser(req, res) {
  const input = await loginSchema.validate(req.body, { abortEarly: false });
  const { user, token } = await login(input.email, input.password);
  return res.cookie(getCookieName(), token, getCookieOptions())
    .json({ user: toUserResponse(user) });
}

export function logoutUser(req, res) {
  const options = { ...getCookieOptions() };
  delete options.maxAge;
  return res.clearCookie(getCookieName(), options).json({ ok: true });
}

export function getCurrentUser(req, res) {
  return res.json({ user: toUserResponse(req.user) });
}
