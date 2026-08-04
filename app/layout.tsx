import type {Metadata} from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'Talia Learn',
  description: 'Talia Learn Educational Platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable}`} suppressHydrationWarning>
      <body className="font-cairo" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
