'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, ChartNoAxesCombined, CircleHelp, LogOut, Plus, RefreshCw, Ticket as TicketIcon } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import type { Book, Ticket, User } from '@/types/portal';
import { LoginPage } from '@/components/auth/LoginPage';
import { BookList } from './BookList';
import { TicketList } from './TicketList';
import { TicketDetailsModal } from './TicketDetailsModal';

type DashboardStats = Record<string, number>;
const navItems = [
  { href: '/', label: 'Overview', icon: ChartNoAxesCombined },
  { href: '/books', label: 'My books', icon: BookOpen },
  { href: '/tickets', label: 'Support tickets', icon: TicketIcon },
];

export function PortalPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats>({});
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [notice, setNotice] = useState('');
  const isAdmin = user?.role === 'admin';
  const view = pathname === '/books' ? 'books' : pathname.startsWith('/tickets') ? 'tickets' : 'overview';

  const load = useCallback(async () => {
    try {
      const me = await api.get('/auth/me');
      setUser(me.data.user);
      const [dashboard, bookResponse, ticketResponse] = await Promise.all([
        api.get('/dashboard'), api.get('/books'), api.get('/tickets?limit=50'),
      ]);
      setStats(dashboard.data);
      const bookData = bookResponse.data.books;
      setBooks(Array.isArray(bookData) ? bookData : bookData.flatMap((group: { books: Book[] }) => group.books));
      setTickets(ticketResponse.data.tickets);
      setError('');
    } catch (cause) {
      if ((cause as { response?: { status?: number } }).response?.status !== 401) {
        setError(getErrorMessage(cause, 'Could not connect to BookLeaf. Check that the API is running.'));
      }
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => {
      void api.get('/tickets?limit=50').then((response) => setTickets(response.data.tickets)).catch(() => undefined);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [user]);

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
    router.push('/');
  }

  if (!user) return <LoginPage onLogin={(signedInUser) => { setUser(signedInUser); void load(); }} />;

  const filteredTickets = tickets.filter((ticket) =>
    `${ticket.ticketNumber} ${ticket.subject} ${ticket.category}`.toLowerCase().includes(search.toLowerCase()),
  );
  const title = view === 'books' ? (isAdmin ? 'All books' : 'Your books') : view === 'tickets' ? 'Support desk' : 'Your publishing desk';
  const metrics = isAdmin
    ? [['All tickets', stats.total ?? 0], ['Active queue', stats.open ?? 0], ['Urgent', stats.urgent ?? 0], ['Authors', stats.authors ?? 0]]
    : [['Titles', stats.books ?? 0], ['Total royalties', `₹${(stats.totalRoyalties ?? 0).toLocaleString('en-IN')}`], ['Pending', `₹${(stats.pendingRoyalties ?? 0).toLocaleString('en-IN')}`], ['Open tickets', stats.openTickets ?? 0]];

  return (
    <div className="min-h-screen md:flex">
      <aside className="flex justify-between bg-leaf-900 p-5 text-white md:min-h-screen md:w-64 md:flex-col md:p-7">
        <div><Link href="/" className="mb-9 flex items-center gap-3"><BookOpen size={23} /><span className="serif text-2xl">BookLeaf</span></Link>
          <p className="mb-3 text-[10px] uppercase tracking-[.2em] text-leaf-100">Workspace</p>
          <nav className="flex gap-2 md:flex-col">{navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm ${pathname === href ? 'bg-white/15 text-white' : 'text-leaf-100 hover:bg-white/10'}`}><Icon size={18} />{href === '/books' && isAdmin ? 'All books' : label}</Link>
          ))}</nav>
        </div>
        <div className="hidden border-t border-white/15 pt-5 md:block"><div className="text-sm font-semibold">{user.name}</div>
          <div className="mt-1 text-xs text-leaf-100">{isAdmin ? 'Support administrator' : 'Author'}</div>
          <button onClick={() => void logout()} className="mt-5 flex items-center gap-2 text-sm text-leaf-100 hover:text-white"><LogOut size={16} />Sign out</button>
        </div>
      </aside>
      <main className="max-w-[1500px] flex-1 p-5 sm:p-8 lg:p-11">
        <header className="mb-9 flex items-start justify-between gap-4"><div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-leaf-700">BookLeaf Publishing</p>
          <h1 className="serif mt-2 text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-2 text-gray-600">Good to see you, {user.name.split(' ')[0]}.</p>
        </div><div className="flex gap-2"><button onClick={() => void load()} title="Refresh" className="rounded-xl border bg-white p-2.5 text-gray-600"><RefreshCw size={18} /></button>
          {!isAdmin && <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-xl bg-leaf-700 px-4 py-2.5 text-sm text-white"><Plus size={17} /><span className="hidden sm:inline">New ticket</span></button>}
        </div></header>
        {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-800">{error}<button className="ml-3 underline" onClick={() => setError('')}>Dismiss</button></div>}
        {notice && <div className="mb-5 rounded-xl bg-green-50 p-4 text-green-800">{notice}</div>}
        {view === 'overview' && <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-5">{metrics.map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6"><p className="text-xs text-gray-500 sm:text-sm">{label}</p><p className="serif mt-2 text-2xl sm:text-3xl">{value}</p></article>
        ))}</section>}
        {view === 'books' && <BookList books={books} />}
        {view === 'tickets' && <><TicketFilters isAdmin={isAdmin} search={search} onSearch={setSearch} onTickets={setTickets} /><TicketList tickets={sortQueue(filteredTickets)} onSelect={setSelectedTicket} /></>}
        {view === 'overview' && <section><div className="mb-4 flex items-center justify-between"><h2 className="serif text-2xl">{isAdmin ? 'Recent support requests' : 'Your titles'}</h2><Link className="text-sm text-leaf-700" href={isAdmin ? '/tickets' : '/books'}>View all →</Link></div>
          {isAdmin ? <TicketList tickets={sortQueue(tickets).slice(0, 5)} onSelect={setSelectedTicket} /> : <BookList books={books.slice(0, 3)} />}</section>}
        <footer className="mt-12 flex justify-between border-t pt-5 text-xs text-gray-500"><span>BookLeaf Publishing · Author care</span><span className="flex items-center gap-1"><CircleHelp size={13} />Help & support</span></footer>
      </main>
      {showNew && <NewTicket books={books} onClose={() => setShowNew(false)} onCreated={async () => { setShowNew(false); await load(); setNotice('Your request has been submitted'); }} />}
      {selectedTicket && <TicketDetailsModal ticket={selectedTicket} user={user} onClose={() => setSelectedTicket(null)} onChanged={() => { void load(); }} />}
    </div>
  );
}

function NewTicket({ books, onClose, onCreated }: { books: Book[]; onClose: () => void; onCreated: () => void }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [values, setValues] = useState({ bookId: '', subject: '', description: '' });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('');
    try {
      const form = new FormData();
      form.append('bookId', values.bookId || 'GENERAL');
      form.append('subject', values.subject);
      form.append('description', values.description);
      if (attachment) form.append('attachment', attachment);
      await api.post('/tickets', form);
      await onCreated();
    }
    catch (cause) { setError(getErrorMessage(cause, 'Could not submit request')); }
    finally { setSubmitting(false); }
  }
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-xl rounded-2xl bg-white p-6">
    <div className="flex justify-between"><h2 className="serif text-2xl">New support request</h2><button onClick={onClose} aria-label="Close">×</button></div>
    <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
      <label className="block text-sm">Related book<select value={values.bookId} onChange={(event) => setValues({ ...values, bookId: event.target.value })} className="mt-1 w-full rounded-xl border p-3"><option value="">General / Account Level</option>{books.map((book) => <option key={book.bookId} value={book.bookId}>{book.title}</option>)}</select></label>
      <label className="block text-sm">Subject<input required minLength={4} maxLength={140} value={values.subject} onChange={(event) => setValues({ ...values, subject: event.target.value })} className="mt-1 w-full rounded-xl border p-3" placeholder="What can we help with?" /></label>
      <label className="block text-sm">Details<textarea required minLength={10} maxLength={5000} rows={5} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} className="mt-1 w-full rounded-xl border p-3" placeholder="Share the details that will help us investigate…" /></label>
      <label className="block text-sm">Attachment (optional)<input type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-xl border p-3" /><span className="mt-1 block text-xs text-gray-500">PDF, Word, text, JPEG, or PNG · 5 MB maximum</span></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={submitting} className="w-full rounded-xl bg-leaf-700 px-4 py-3 text-white disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit request'}</button>
    </form>
  </div></div>;
}

function TicketFilters({ isAdmin, search, onSearch, onTickets }: {
  isAdmin: boolean; search: string; onSearch: (value: string) => void; onTickets: (tickets: Ticket[]) => void;
}) {
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ limit: '50' });
    for (const [key, value] of Object.entries({ status, category, priority, from, to, q: search })) {
      if (value) params.set(key, value);
    }
    try {
      const response = await api.get(`/tickets?${params.toString()}`);
      onTickets(response.data.tickets);
    } catch {
      // The shared page displays the connection error when refreshing its data.
    }
  }

  if (!isAdmin) return <div className="mb-5"><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search tickets" className="w-full rounded-xl border bg-white px-4 py-2.5" /></div>;
  return <form onSubmit={(event) => void applyFilters(event)} className="mb-5 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
    <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search tickets" className="rounded-xl border px-3 py-2" />
    <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border bg-white px-3 py-2"><option value="">All statuses</option>{['Open', 'In Progress', 'Waiting on Author', 'Resolved', 'Closed'].map((value) => <option key={value}>{value}</option>)}</select>
    <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border bg-white px-3 py-2"><option value="">All categories</option>{['Royalties & Payments', 'ISBN & Metadata Issues', 'Printing & Quality', 'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry'].map((value) => <option key={value}>{value}</option>)}</select>
    <select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-xl border bg-white px-3 py-2"><option value="">All priorities</option>{['Critical', 'High', 'Medium', 'Low'].map((value) => <option key={value}>{value}</option>)}</select>
    <label className="text-xs text-gray-500">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label>
    <label className="text-xs text-gray-500">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label>
    <button className="rounded-xl bg-leaf-700 px-4 py-2 text-sm text-white lg:col-span-2">Apply filters</button>
  </form>;
}

function sortQueue(items: Ticket[]) {
  const rank: Record<string, number> = { Critical: 0, Urgent: 0, High: 1, Medium: 2, Low: 3 };
  return [...items].sort((a, b) => {
    const aOpen = ['Resolved', 'Closed'].includes(a.status) ? 1 : 0;
    const bOpen = ['Resolved', 'Closed'].includes(b.status) ? 1 : 0;
    return aOpen - bOpen || (rank[a.priority] ?? 4) - (rank[b.priority] ?? 4)
      || new Date(a.createdAt || 0).valueOf() - new Date(b.createdAt || 0).valueOf();
  });
}
