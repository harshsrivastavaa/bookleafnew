import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) return error.response?.data?.error ?? fallback;
  return fallback;
}
