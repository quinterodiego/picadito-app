import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import QueryProvider from '@/components/QueryProvider';
import { Toaster } from '@/components/ui/sonner';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'No Cazo Un Fulbo',
  description: 'La app para organizar el fulbo con amigos.',
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
          <header className="w-full max-w-5xl mx-auto px-5 pt-5 pb-3">
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-black text-brand tracking-tight leading-none">No Cazo Un Fulbo</h1>
              <span className="text-slate-400 text-xs hidden sm:inline">La app para organizar el fulbo con amigos.</span>
            </div>
          </header>
          <main className="w-full max-w-5xl mx-auto navbar-safe-padding px-5 pb-5">{children}</main>
          <Navbar />
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
