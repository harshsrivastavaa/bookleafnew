import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { Author, User } from '../models/index.js';

function mapBook(book) {
  return {
    bookId: book.book_id,
    title: book.title,
    isbn: book.isbn,
    genre: book.genre,
    publicationDate: book.publication_date ? new Date(book.publication_date) : null,
    status: book.status,
    mrp: book.mrp,
    authorRoyaltyPerCopy: book.author_royalty_per_copy,
    totalCopiesSold: book.total_copies_sold,
    totalRoyaltyEarned: book.total_royalty_earned,
    royaltyPaid: book.royalty_paid,
    royaltyPending: book.royalty_pending,
    lastRoyaltyPayoutDate: book.last_royalty_payout_date ? new Date(book.last_royalty_payout_date) : null,
    printPartner: book.print_partner,
    availableOn: book.available_on,
  };
}

async function upsertAuthor(authorData, authorPasswordHash) {
  const author = await Author.findOneAndUpdate(
    { authorId: authorData.author_id },
    {
      authorId: authorData.author_id,
      name: authorData.name,
      email: authorData.email,
      phone: authorData.phone,
      city: authorData.city,
      joinedDate: new Date(authorData.joined_date),
      books: authorData.books.map(mapBook),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await User.findOneAndUpdate(
    { email: authorData.email.toLowerCase() },
    {
      email: authorData.email,
      name: authorData.name,
      role: 'author',
      author: author._id,
      passwordHash: authorPasswordHash,
    },
    { upsert: true, setDefaultsOnInsert: true, runValidators: true },
  );
}

export async function runSeed() {
  const dataPath = new URL('../../../frontend/bookleaf_sample_data.json', import.meta.url);
  const data = JSON.parse(await readFile(dataPath, 'utf8'));
  if (!Array.isArray(data.authors)) throw new Error('Seed data must include an authors array');

  const authorPasswordHash = await bcrypt.hash(process.env.SEED_AUTHOR_PASSWORD || 'BookLeafDemo-123!', 12);
  for (const author of data.authors) await upsertAuthor(author, authorPasswordHash);

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const adminPasswordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'BookLeafAdmin-123!', 12);
  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      email: adminEmail,
      name: 'BookLeaf Support',
      role: 'admin',
      author: null,
      passwordHash: adminPasswordHash,
    },
    { upsert: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const bookCount = data.authors.reduce((total, author) => total + author.books.length, 0);
  console.info(`Seeded ${data.authors.length} authors and ${bookCount} books; admin ${adminEmail}.`);
}
