export type User = { id: string; name: string; email: string; role: 'admin' | 'author' };
export type Book = {
  bookId: string; title: string; isbn?: string; genre: string; publicationDate?: string | null;
  status: string; mrp: number | null; authorRoyaltyPerCopy?: number | null;
  totalCopiesSold: number; totalRoyaltyEarned: number; royaltyPaid?: number; royaltyPending: number;
  lastRoyaltyPayoutDate?: string | null; printPartner?: string; availableOn: string[];
  author?: { id: string; authorId?: string; name: string; email: string };
};
export type TicketMessage = { body: string; internal: boolean; senderRole: string; createdAt: string };
export type TicketAttachment = { fileName: string; mimeType: string; size: number };
export type Ticket = {
  _id: string; ticketNumber: string; subject: string; description: string; category: string;
  priority: string; status: string; bookId: string; assignedTo?: { _id: string; name: string } | null;
  author?: { _id: string; name: string; email: string };
  attachment?: TicketAttachment | null; messages?: TicketMessage[]; createdAt?: string;
};
