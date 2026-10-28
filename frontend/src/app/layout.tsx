import type { Metadata } from 'next';
import { PortalPage } from '@/components/portal/PortalPage';
import './globals.css';

export const metadata: Metadata = {
  title: 'BookLeaf Author Portal',
  description: 'Publishing, royalties and author support',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PortalPage />
        {children}
      </body>
    </html>
  );
}
