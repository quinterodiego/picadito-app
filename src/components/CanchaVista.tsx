'use client';

import type { Jugador } from '@/lib/types';

// Formaciones por cantidad de jugadores: [x_ratio, y_ratio]
// x: 0=izquierda, 1=derecha
// y: 0=arco propio, 1=línea del medio
const FORMATIONS: Record<number, [number, number][]> = {
  4: [[.50,.09], [.28,.46], [.72,.46], [.50,.80]],
  5: [[.50,.09], [.25,.38], [.75,.38], [.25,.72], [.75,.72]],
  6: [[.50,.09], [.22,.32], [.78,.32], [.50,.53], [.25,.74], [.75,.74]],
  7: [[.50,.08], [.20,.28], [.80,.28], [.36,.48], [.64,.48], [.22,.73], [.78,.73]],
};

function fallback(n: number): [number, number][] {
  const result: [number, number][] = [[0.5, 0.09]];
  const rest = n - 1;
  for (let i = 0; i < rest; i++) {
    const row = Math.floor(i / 2);
    const rows = Math.ceil(rest / 2);
    const x = i % 2 === 0 ? 0.28 : 0.72;
    const y = 0.3 + (row / Math.max(rows - 1, 1)) * 0.55;
    result.push([x, y]);
  }
  return result;
}

// El primer jugador del array es siempre el GK (el usuario puede reordenar en el editor)
function sortTeam(equipo: Jugador[]): Jugador[] {
  return equipo; // ya viene ordenado con GK primero desde el editor
}

function getFormation(n: number): [number, number][] {
  return FORMATIONS[n] ?? fallback(n);
}

export default function CanchaVista({ equipo1, equipo2 }: { equipo1: Jugador[]; equipo2: Jugador[] }) {
  const s1 = sortTeam(equipo1);
  const s2 = sortTeam(equipo2);
  const p1 = getFormation(s1.length);
  const p2 = getFormation(s2.length);

  const W = 280, H = 430;
  const ml = 14, mt = 16;
  const fw = W - 2 * ml;
  const fh = H - 2 * mt;
  const hh = fh / 2;
  const cx = W / 2;
  const cy = mt + hh;
  const R = 14;

  function pos(xr: number, yr: number, team: 1 | 2): [number, number] {
    const x = ml + xr * fw;
    const y = team === 1 ? mt + yr * hh : mt + fh - yr * hh;
    return [x, y];
  }

  const stripeH = fh / 8;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl shadow-lg">
      {/* Fondo */}
      <rect width={W} height={H} fill="#14532d" rx="8" />

      {/* Franjas de pasto */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={ml} y={mt + i * stripeH} width={fw} height={stripeH}
          fill={i % 2 === 0 ? '#166534' : '#15803d'} />
      ))}

      {/* Borde de cancha */}
      <rect x={ml} y={mt} width={fw} height={fh} fill="none" stroke="white" strokeWidth="1.5" />

      {/* Línea del medio */}
      <line x1={ml} y1={cy} x2={ml + fw} y2={cy} stroke="white" strokeWidth="1.5" />

      {/* Círculo central */}
      <circle cx={cx} cy={cy} r={36} fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={2.5} fill="white" />

      {/* Áreas */}
      <rect x={cx - 62} y={mt} width={124} height={66} fill="none" stroke="white" strokeWidth="1.5" />
      <rect x={cx - 62} y={mt + fh - 66} width={124} height={66} fill="none" stroke="white" strokeWidth="1.5" />

      {/* Puntos de penal */}
      <circle cx={cx} cy={mt + 50} r={2} fill="white" />
      <circle cx={cx} cy={mt + fh - 50} r={2} fill="white" />

      {/* Arcos */}
      <rect x={cx - 30} y={mt - 11} width={60} height={11} fill="none" stroke="white" strokeWidth="1.5" />
      <rect x={cx - 30} y={mt + fh} width={60} height={11} fill="none" stroke="white" strokeWidth="1.5" />

      {/* Etiquetas de equipo */}
      <text x={cx} y={cy - 7} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="1">BLANCOS</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="1">VERDES</text>

      {/* Equipo 1 — Blancos (arriba) */}
      {s1.map((j, i) => {
        const [xr, yr] = p1[i] ?? [0.5, 0.5];
        const [px, py] = pos(xr, yr, 1);
        const isGK = i === 0;
        const name = (j.apodo || j.nombre).substring(0, 8);
        return (
          <g key={j.id}>
            {isGK && <circle cx={px} cy={py} r={R + 3} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" />}
            <circle cx={px} cy={py} r={R} fill={isGK ? '#fbbf24' : 'white'} stroke={isGK ? '#d97706' : '#e2e8f0'} strokeWidth="1.5" />
            <text x={px} y={py + 3.5} textAnchor="middle" fill={isGK ? '#7c2d12' : '#1e293b'}
              fontSize="6.5" fontWeight="700" fontFamily="system-ui, sans-serif">{name}</text>
          </g>
        );
      })}

      {/* Equipo 2 — Verdes (abajo) */}
      {s2.map((j, i) => {
        const [xr, yr] = p2[i] ?? [0.5, 0.5];
        const [px, py] = pos(xr, yr, 2);
        const isGK = i === 0;
        const name = (j.apodo || j.nombre).substring(0, 8);
        return (
          <g key={j.id}>
            {isGK && <circle cx={px} cy={py} r={R + 3} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" />}
            <circle cx={px} cy={py} r={R} fill={isGK ? '#fbbf24' : '#22c55e'} stroke={isGK ? '#d97706' : '#16a34a'} strokeWidth="1.5" />
            <text x={px} y={py + 3.5} textAnchor="middle" fill={isGK ? '#7c2d12' : 'white'}
              fontSize="6.5" fontWeight="700" fontFamily="system-ui, sans-serif">{name}</text>
          </g>
        );
      })}
    </svg>
  );
}
