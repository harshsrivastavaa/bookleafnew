import { Ticket as TicketIcon } from 'lucide-react';
import type { Ticket } from '@/types/portal';

export function Badge({ text }: { text: string }) {
  return <span className="rounded-full bg-leaf-50 px-2.5 py-1 text-xs font-medium text-leaf-700">{text}</span>;
}

export function TicketList({ tickets, onSelect }: { tickets: Ticket[]; onSelect: (ticket: Ticket) => void }) {
  if (!tickets.length) return (
    <div className="rounded-2xl border bg-white p-10 text-center">
      <TicketIcon className="mx-auto text-leaf-600" /><h3 className="serif mt-3 text-xl">All caught up</h3>
      <p className="mt-1 text-sm text-gray-500">Support requests will appear here.</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <button key={ticket._id} onClick={() => onSelect(ticket)} className="w-full rounded-2xl border bg-white p-4 text-left hover:border-leaf-600 sm:p-5">
          <div className="flex justify-between gap-4"><div>
            <div className="text-xs text-gray-500">{ticket.ticketNumber} · {ticket.category}</div>
            <h3 className="mt-1 font-semibold">{ticket.subject}</h3><div className="mt-2 text-xs text-gray-500">{ticket.bookId === 'GENERAL' ? 'General / Account Level' : `Book ${ticket.bookId}`}{ticket.author ? ` · ${ticket.author.name}` : ''}</div>
          </div><div className="shrink-0 text-right"><Badge text={ticket.status} /><div className={`mt-2 text-xs font-semibold ${ticket.priority === 'Critical' || ticket.priority === 'Urgent' ? 'text-red-700' : ticket.priority === 'High' ? 'text-orange-700' : 'text-gray-500'}`}>{ticket.priority}</div>{ticket.createdAt && <div className="mt-1 text-[10px] text-gray-400">{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</div>}</div></div>
        </button>
      ))}
    </div>
  );
}
