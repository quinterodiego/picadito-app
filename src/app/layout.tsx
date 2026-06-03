import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import QueryProvider from '@/components/QueryProvider';
import { Toaster } from '@/components/ui/sonner';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Picadito App',
  description: 'Armá los equipos del picado semanal',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover', // necesario para safe-area en iOS
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <QueryProvider>
          <main className="w-full max-w-5xl mx-auto navbar-safe-padding px-5 pt-5">{children}</main>
          <Navbar />
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
