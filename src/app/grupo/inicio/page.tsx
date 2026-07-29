'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function GrupoInicioPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<'crear' | 'unirse'>('crear');
  const [nombre, setNombre] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ensure Sheets tabs exist, then refresh JWT to pick up userId + groupId
  useEffect(() => {
    async function init() {
      try { await axios.post('/api/setup'); } catch { /* idempotent */ }
      const updated = await update();
      // If the JWT refresh already found a group, redirect immediately
      if (updated?.user?.groupId) {
        router.replace('/');
        return;
      }
      setChecking(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if already has group (catches reactive session updates)
  useEffect(() => {
    if (session?.user?.groupId) router.replace('/');
  }, [session?.user?.groupId, router]);

  if (checking || status === 'loading' || session?.user?.groupId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/grupos', { nombre: nombre.trim() || 'Mi Grupo' });
      await update();
      router.replace('/');
    } catch {
      setError('No se pudo crear el grupo. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnirse(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/grupos', { action: 'unirse', inviteCode: inviteCode.trim().toUpperCase() });
      await update();
      router.replace('/');
    } catch {
      setError('Código inválido o ya sos miembro del grupo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-brand">Configurá tu grupo</h1>
        <p className="text-sm text-slate-400">Si ya tenías datos cargados, hacé click en <strong>Crear grupo</strong> y se van a recuperar automáticamente.</p>
      </div>

      <p className="text-xs text-slate-400">
        Conectado como <span className="font-medium">{session?.user?.email}</span>.{' '}
        <a href="/api/logout" className="underline hover:text-slate-600">
          Salir
        </a>
      </p>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setTab('crear')}
            className={`flex-1 py-3 text-sm font-medium cursor-pointer transition-colors ${tab === 'crear' ? 'text-brand border-b-2 border-brand' : 'text-slate-400'}`}
          >
            Crear grupo
          </button>
          <button
            onClick={() => setTab('unirse')}
            className={`flex-1 py-3 text-sm font-medium cursor-pointer transition-colors ${tab === 'unirse' ? 'text-brand border-b-2 border-brand' : 'text-slate-400'}`}
          >
            Unirse
          </button>
        </div>

        <div className="p-5">
          {tab === 'crear' ? (
            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Nombre del grupo</label>
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Los Cracks del Jueves"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Creando...' : 'Crear grupo'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUnirse} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Código de invitación</label>
                <input
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="Ej: ABC123"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Uniéndose...' : 'Unirse al grupo'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
