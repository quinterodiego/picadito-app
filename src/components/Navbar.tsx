'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, Clock, BarChart2 } from 'lucide-react';

const links = [
  { href: '/', label: 'Partido', icon: Calendar },
  { href: '/jugadores', label: 'Jugadores', icon: Users },
  { href: '/historial', label: 'Historial', icon: Clock },
  { href: '/estadisticas', label: 'Stats', icon: BarChart2 },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`cursor-pointer flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                active ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
