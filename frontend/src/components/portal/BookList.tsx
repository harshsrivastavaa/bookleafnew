'use client';

import { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import type { Book } from '@/types/portal';

export function BookList({ books }: { books: Book[] }) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  if (!books.length) return <div className="rounded-2xl bg-white p-10 text-gray-500">No titles found.</div>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book) => (
        <button key={`${book.author?.id ?? ''}-${book.bookId}`} onClick={() => setSelectedBook(book)} className="flex gap-4 rounded-2xl border bg-white p-5 text-left hover:border-leaf-600">
          <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700"><BookOpen /></div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-leaf-700">{book.status}</p>
            <h3 className="serif mt-1 text-xl leading-tight">{book.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{book.genre}</p>
            <p className="mt-3 text-xs text-gray-500">{book.totalCopiesSold ?? 0} copies · ₹{(book.royaltyPending ?? 0).toLocaleString('en-IN')} pending</p>
          </div>
        </button>
      ))}
      {selectedBook && <BookDetails book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  );
}

function BookDetails({ book, onClose }: { book: Book; onClose: () => void }) {
  const details: [string, string][] = [
    ['ISBN', book.isbn || '—'], ['Genre', book.genre || '—'], ['Publication date', formatDate(book.publicationDate)],
    ['Status', book.status], ['MRP', formatMoney(book.mrp)], ['Copies sold', String(book.totalCopiesSold ?? 0)],
    ['Royalty earned', formatMoney(book.totalRoyaltyEarned)], ['Royalty paid', formatMoney(book.royaltyPaid)],
    ['Royalty pending', formatMoney(book.royaltyPending)], ['Royalty per copy', formatMoney(book.authorRoyaltyPerCopy)],
    ['Last payout', formatDate(book.lastRoyaltyPayoutDate)], ['Print partner', book.printPartner || '—'],
    ['Available on', book.availableOn?.join(', ') || '—'],
  ];
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="book-details-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-leaf-700">Book details</p><h2 id="book-details-title" className="serif mt-1 text-2xl">{book.title}</h2>{book.author && <p className="mt-1 text-sm text-gray-500">{book.author.name} · {book.author.email}</p>}</div><button onClick={onClose} aria-label="Close details"><X /></button></div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="rounded-xl bg-gray-50 p-3"><dt className="text-xs text-gray-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>)}</dl>
    </section>
  </div>;
}

function formatMoney(value?: number | null) {
  return value == null ? '—' : `₹${value.toLocaleString('en-IN')}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : date.toLocaleDateString('en-IN');
}
