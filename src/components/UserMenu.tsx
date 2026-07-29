'use client';

import { useSession } from 'next-auth/react';

export default function UserMenu() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  return (
    <a
      href="/api/logout"
      className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 transition-colors leading-tight text-right"
      title="Cerrar sesión"
    >
      <span className="block max-w-30 truncate">{session.user.email}</span>
      <span className="block text-slate-300 hover:text-red-400 transition-colors">Salir</span>
    </a>
  );
}