'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { Users2, CalendarDays, BarChart2 } from 'lucide-react';

const FEATURES = [
  {
    icon: Users2,
    label: 'Armá equipos balanceados por nivel',
    iconClass: 'bg-brand/10 text-brand',
  },
  {
    icon: CalendarDays,
    label: 'Guardá el historial de cada partido',
    iconClass: 'bg-brand/10 text-brand',
  },
  {
    icon: BarChart2,
    label: 'Tabla de puntos y estadísticas del grupo',
    iconClass: 'bg-[#f1eb4f]/50 text-[#5a5200]',
  },
];

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    await signIn('google', { callbackUrl: '/' });
  }

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center justify-center px-6 py-16 text-center gap-8 -mx-5 -mt-4 rounded-b-3xl overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 110% 70% at 50% 10%, #1e4a28 0%, #091410 100%)',
          minHeight: 'calc(100svh - 76px)',
        }}
      >
        <Image
          src="/logo.png"
          alt="No Cazo Un Fulbo"
          width={80}
          height={80}
          className="rounded-2xl shadow-lg"
          priority
        />

        <div className="space-y-4 max-w-xs">
          <h1
            className="font-black text-white leading-[1.02] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem, 12vw, 3.6rem)', textWrap: 'balance' } as React.CSSProperties}
          >
            No Cazo<br />Un Fulbo
          </h1>
          <p className="text-[#8ab89a] text-[15px] leading-relaxed">
            Organizá los partidos de tu grupo y obtené estadísticas para compartir con tus amigos.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="cursor-pointer font-bold px-9 py-3.5 rounded-full text-[15px] transition-all active:scale-95"
          style={{ background: '#f1eb4f', color: '#1a2d1d' }}
        >
          Ingresar
        </button>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="px-1 py-8 space-y-3">
        {FEATURES.map(({ icon: Icon, label, iconClass }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
          >
            <span className={`p-2.5 rounded-xl shrink-0 ${iconClass}`}>
              <Icon size={18} strokeWidth={2} />
            </span>
            <span className="text-sm font-medium text-slate-700 leading-snug">{label}</span>
          </div>
        ))}
      </section>

      {/* ── Modal de login ───────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <Image src="/logo.png" alt="" width={52} height={52} className="rounded-xl" />
              <div>
                <h2 className="text-lg font-black text-slate-800">Bienvenido</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Usá tu cuenta de Google para ingresar
                </p>
              </div>
            </div>

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="cursor-pointer w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <GoogleIcon />
              {loading ? 'Redirigiendo...' : 'Continuar con Google'}
            </button>

            <p className="text-[11px] text-slate-300 text-center leading-relaxed">
              Solo usamos tu email para identificarte.<br />
              No compartimos datos con terceros.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.251 17.64 11.943 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A9 9 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
