import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '11th Installation Ceremony | Rotaract Club of Pune Royal',
  description:
    'Paperless Green Initiative - Official Attendee Registration & Live MOC Desk for the 11th Installation Ceremony of Rotaract Club of Pune Royal (RID 3131).',
  icons: {
    icon: '/logos/pune-royal-shield.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#060919] text-slate-100 royal-bg-mesh antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
