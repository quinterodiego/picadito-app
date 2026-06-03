import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import Image from 'next/image';
import './globals.css';
import Navbar from '@/components/Navbar';
import QueryProvider from '@/components/QueryProvider';
import { Toaster } from '@/components/ui/sonner';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'No Cazo Un Fulbo',
  description: 'La app para organizar el fulbo con amigos.',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <QueryProvider>
          <header className="w-full max-w-5xl mx-auto px-5 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="No Cazo Un Fulbo" width={64} height={64} className="rounded-lg" />
              <div>
                <p className="text-base font-black text-brand tracking-tight leading-tight">No Cazo Un Fulbo</p>
                <p className="text-xs text-slate-400 leading-tight hidden sm:block">La app para organizar el fulbo con amigos.</p>
              </div>
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
