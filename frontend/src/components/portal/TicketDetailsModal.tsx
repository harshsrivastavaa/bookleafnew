'use client';

import { useRef, useState } from 'react';
import { Download, LoaderCircle, WandSparkles, X } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import type { Ticket, User } from '@/types/portal';

const categories = ['Royalties & Payments', 'ISBN & Metadata Issues', 'Printing & Quality', 'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry', 'Book Distribution', 'Publishing Process', 'Technical Support', 'Marketing & Promotion', 'Other'];
const statuses = ['Open', 'In Progress', 'Waiting on Author', 'Resolved', 'Closed'];
const priorities = ['Critical', 'High', 'Medium', 'Low'];

export function TicketDetailsModal({ ticket: initialTicket, user, onClose, onChanged }: {
  ticket: Ticket; user: User; onClose: () => void; onChanged: () => void;
}) {
  const [ticket, setTicket] = useState(initialTicket);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftError, setDraftError] = useState('');
  const draftRequestInFlight = useRef(false);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState('');
  const isAdmin = user.role === 'admin';

  async function generateDraft() {
    if (draftRequestInFlight.current) return;
    draftRequestInFlight.current = true;
    setIsGeneratingDraft(true);
    setDraftError('');
    try {
      const response = await api.post(`/tickets/${ticket._id}/ai-draft`);
      if (typeof response.data.draft !== 'string' || !response.data.draft.trim()) {
        throw new Error('Gemini returned an empty draft. Write a reply manually below.');
      }
      setDraft(response.data.draft);
    } catch (cause) {
      setDraftError(getErrorMessage(cause, 'AI drafting failed. Write and send a reply manually below.'));
    } finally {
      draftRequestInFlight.current = false;
      setIsGeneratingDraft(false);
    }
  }

  async function refreshTicket() {
    const response = await api.get(`/tickets/${ticket._id}`);
    setTicket(response.data.ticket);
    onChanged();
  }

  async function saveChanges(changes: Record<string, string>) {
    setBusy(true); setError('');
    try { await api.patch(`/tickets/${ticket._id}`, changes); await refreshTicket(); }
    catch (cause) { setError(getErrorMessage(cause, 'Could not update ticket')); }
    finally { setBusy(false); }
  }

  async function postMessage(path: 'replies' | 'notes', body: string, clear: () => void) {
    if (!body.trim()) return;
    setBusy(true); setError('');
    try { await api.post(`/tickets/${ticket._id}/${path}`, { body }); clear(); await refreshTicket(); }
    catch (cause) { setError(getErrorMessage(cause, 'Could not send message')); }
    finally { setBusy(false); }
  }

  async function sendDraft() {
    await postMessage('replies', draft, () => setDraft(''));
  }

  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
      <header className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-leaf-700">{ticket.ticketNumber} · {ticket.category}</p><h2 id="ticket-detail-title" className="serif mt-1 text-2xl">{ticket.subject}</h2><p className="mt-1 text-sm text-gray-500">{ticket.author ? `${ticket.author.name} · ${ticket.author.email}` : ''}{ticket.createdAt ? ` · ${new Date(ticket.createdAt).toLocaleString('en-IN')}` : ''}</p></div><button onClick={onClose} aria-label="Close ticket"><X /></button></header>
      {error && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      <div className="mt-5 rounded-xl bg-gray-50 p-4"><p className="whitespace-pre-wrap text-sm">{ticket.description}</p>{ticket.attachment && <a className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-leaf-700 underline" href={`${api.defaults.baseURL}/tickets/${ticket._id}/attachment`}><Download size={16} />{ticket.attachment.fileName} ({formatSize(ticket.attachment.size)})</a>}</div>

      {isAdmin && <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-gray-500">Status<select disabled={busy} value={ticket.status} onChange={(event) => void saveChanges({ status: event.target.value })} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs text-gray-500">Category<select disabled={busy} value={ticket.category} onChange={(event) => void saveChanges({ category: event.target.value })} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs text-gray-500">Priority<select disabled={busy} value={ticket.priority} onChange={(event) => void saveChanges({ priority: event.target.value })} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">{priorities.map((value) => <option key={value}>{value}</option>)}</select></label>
        <button disabled={busy} onClick={() => void saveChanges({ assignedTo: user.id })} className="rounded-lg border px-3 py-2 text-sm sm:col-span-3">{ticket.assignedTo?._id === user.id ? 'Assigned to you' : 'Assign ticket to me'}</button>
      </div>}

      <div className="mt-6"><h3 className="serif text-xl">Conversation</h3><div className="mt-3 space-y-3">{(ticket.messages || []).map((message, index) => <article key={`${message.createdAt}-${index}`} className="rounded-xl border p-3"><div className="flex justify-between text-xs text-gray-500"><span>{message.senderRole}{message.internal ? ' · Internal note' : ''}</span><time>{new Date(message.createdAt).toLocaleString('en-IN')}</time></div><p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p></article>)}</div></div>

      {isAdmin && <div className="mt-5 rounded-xl border border-leaf-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">AI response draft</h3><p className="text-xs text-gray-500">Review or edit before sending. AI is optional.</p></div>
          <button type="button" disabled={isGeneratingDraft} onClick={() => void generateDraft()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60">
            {isGeneratingDraft ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}
            {isGeneratingDraft ? 'Generating…' : draft ? 'Regenerate draft' : 'Generate draft'}
          </button>
        </div>
        {draftError && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{draftError} Your ticket is still available; use the reply field below to respond manually.</p>}
        <textarea aria-label="AI generated or editable draft" value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} className="mt-3 w-full rounded-lg border p-3" placeholder="Generate a draft or write a response here…" />
        <button disabled={busy || !draft.trim()} onClick={() => void sendDraft()} className="mt-2 rounded-lg bg-leaf-700 px-4 py-2 text-sm text-white disabled:opacity-50">Send response</button>
      </div>}
      <div className="mt-4"><label className="text-sm font-semibold">{isAdmin ? 'Write a reply' : 'Reply'}<textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border p-3" placeholder="Write a message…" /></label><button disabled={busy || !reply.trim()} onClick={() => void postMessage('replies', reply, () => setReply(''))} className="mt-2 rounded-lg bg-leaf-700 px-4 py-2 text-sm text-white disabled:opacity-50">Send reply</button></div>
      {isAdmin && <div className="mt-4 border-t pt-4"><label className="text-sm font-semibold">Internal note <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} className="mt-2 w-full rounded-lg border p-3" placeholder="Visible to the support team only" /></label><button disabled={busy || !note.trim()} onClick={() => void postMessage('notes', note, () => setNote(''))} className="mt-2 rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Add internal note</button></div>}
    </section>
  </div>;
}

function formatSize(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
