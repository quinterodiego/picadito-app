'use client';

import { useState, useRef } from 'react';
import { ArrowLeftRight, ChevronLeft, ChevronRight, ImageDown, Check } from 'lucide-react';
import type { Jugador } from '@/lib/types';

// ─── Formation catalog ────────────────────────────────────────────────────────
type FormationDef = { name: string; rows: number[] };

const CATALOG: Record<number, FormationDef[]> = {
  2:  [{ name: '1-1',     rows: [1,1]       }],
  3:  [{ name: '1-2',     rows: [1,2]       }, { name: '1-1-1',   rows: [1,1,1]     }],
  4:  [{ name: '1-2-1',   rows: [1,2,1]     }, { name: '1-1-2',   rows: [1,1,2]     }],
  5:  [{ name: '1-2-2',   rows: [1,2,2]     }, { name: '1-3-1',   rows: [1,3,1]     }, { name: '1-1-3',   rows: [1,1,3]   }],
  6:  [{ name: '1-2-3',   rows: [1,2,3]     }, { name: '1-3-2',   rows: [1,3,2]     }, { name: '1-2-2-1', rows: [1,2,2,1] }],
  7:  [{ name: '1-3-3',   rows: [1,3,3]     }, { name: '1-3-2-1', rows: [1,3,2,1]   }, { name: '1-2-3-1', rows: [1,2,3,1] }],
  8:  [{ name: '1-3-3-1', rows: [1,3,3,1]   }, { name: '1-3-2-2', rows: [1,3,2,2]   }, { name: '1-2-3-2', rows: [1,2,3,2] }],
  9:  [{ name: '1-4-3-1', rows: [1,4,3,1]   }, { name: '1-3-4-1', rows: [1,3,4,1]   }, { name: '1-3-3-2', rows: [1,3,3,2] }],
  10: [{ name: '1-4-4-1', rows: [1,4,4,1]   }, { name: '1-4-3-2', rows: [1,4,3,2]   }, { name: '1-3-5-1', rows: [1,3,5,1] }],
  11: [{ name: '1-4-4-2', rows: [1,4,4,2]   }, { name: '1-4-3-3', rows: [1,4,3,3]   }, { name: '1-3-4-3', rows: [1,3,4,3] }],
};

function getOptions(n: number): FormationDef[] {
  if (CATALOG[n]) return CATALOG[n];
  const out = n - 1;
  const half = Math.ceil(out / 2);
  return [{ name: `1-${half}-${out - half}`, rows: [1, half, out - half] }];
}

function buildPositions(rows: number[]): [number, number][] {
  const positions: [number, number][] = [[0.5, 0.08]];
  const outfield = rows.slice(1);
  const nRows = outfield.length;
  if (nRows === 0) return positions;
  outfield.forEach((count, i) => {
    const y = nRows === 1 ? 0.54 : 0.27 + (i / (nRows - 1)) * 0.53;
    for (let j = 0; j < count; j++) {
      const x = count === 1 ? 0.5 : 0.15 + (j / (count - 1)) * 0.70;
      positions.push([x, y]);
    }
  });
  return positions;
}

function outfieldLabels(n: number): string[] {
  if (n === 0) return [];
  if (n === 1) return ['DEL'];
  if (n === 2) return ['DEF', 'DEL'];
  return ['DEF', ...Array(n - 2).fill('MED'), 'DEL'];
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const CAMISETA = {
  blanca: { fill: 'white',   stroke: '#e2e8f0', text: '#1e293b' },
  verde:  { fill: '#17902e', stroke: '#0f6620', text: 'white'   },
  gk:     { fill: '#f1eb4f', stroke: '#d97706', text: '#7c2d12' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function CanchaVista({ equipo1, equipo2 }: { equipo1: Jugador[]; equipo2: Jugador[] }) {
  const [invertido, setInvertido] = useState(false);
  const [formIdx1, setFormIdx1]   = useState(0);
  const [formIdx2, setFormIdx2]   = useState(0);
  const [copied, setCopied]       = useState(false);
  const svgPortraitRef            = useRef<SVGSVGElement>(null);
  const svgLandscapeRef           = useRef<SVGSVGElement>(null);

  const opts1 = getOptions(equipo1.length);
  const opts2 = getOptions(equipo2.length);
  const f1    = opts1[Math.min(formIdx1, opts1.length - 1)];
  const f2    = opts2[Math.min(formIdx2, opts2.length - 1)];
  const p1    = buildPositions(f1.rows);
  const p2    = buildPositions(f2.rows);

  const color1    = invertido ? 'verde' : 'blanca';
  const color2    = invertido ? 'blanca' : 'verde';
  const label1    = invertido ? 'OSCURO' : 'CLARO';
  const label2    = invertido ? 'CLARO'  : 'OSCURO';
  const formLabel = `A: ${f1.name} · B: ${f2.name}`;

  // ─── Copy field as image ────────────────────────────────────────────────────
  async function copyImage() {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const svg = (isDesktop ? svgLandscapeRef : svgPortraitRef).current;
    if (!svg) return;

    const vb   = svg.viewBox.baseVal;
    const W    = vb.width, H = vb.height;
    const scale = 2; // retina quality

    const svgStr = new XMLSerializer().serializeToString(svg);
    const blob   = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url    = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width  = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);

      canvas.toBlob(async (png) => {
        if (!png) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Fallback: trigger download if clipboard API not available
          const a = document.createElement('a');
          a.href = URL.createObjectURL(png);
          a.download = 'equipos-ncuf.png';
          a.click();
        }
      }, 'image/png');
    };
    img.src = url;
  }

  // ─── SVG renderer (portrait & landscape) ────────────────────────────────────
  function renderSvg(landscape: boolean, ref: React.RefObject<SVGSVGElement>) {
    // Dimensions
    const W  = landscape ? 440 : 280;
    const H  = landscape ? 272 : 430;
    const ml = landscape ? 16  : 14;
    const mt = landscape ? 14  : 16;
    const fw = W - 2 * ml;
    const fh = H - 2 * mt;
    const cx = W / 2;
    const cy = H / 2;
    const hw = fw / 2; // half-width (landscape only)
    const hh = fh / 2; // half-height (portrait only)
    const R  = landscape ? 15 : 17;

    function svgPos(xr: number, yr: number, team: 1 | 2): [number, number] {
      if (landscape) {
        // xr → vertical spread, yr → horizontal depth from goal
        return [
          team === 1 ? ml + yr * hw : ml + fw - yr * hw,
          mt + xr * fh,
        ];
      }
      return [ml + xr * fw, team === 1 ? mt + yr * hh : mt + fh - yr * hh];
    }

    function renderEquipo(
      jugadores: Jugador[],
      positions: [number, number][],
      team: 1 | 2,
      colorKey: 'blanca' | 'verde',
    ) {
      return jugadores.map((j, i) => {
        const [xr, yr] = positions[i] ?? [0.5, 0.5];
        const [px, py] = svgPos(xr, yr, team);
        const isGK = i === 0;
        const c    = isGK ? CAMISETA.gk : CAMISETA[colorKey];
        const name = (j.apodo || j.nombre).substring(0, 11);
        // In portrait: team1 names go below (toward midfield), team2 go above
        // In landscape: always below
        const nameY = landscape ? py + R + 9 : team === 1 ? py + R + 9 : py - R - 5;
        return (
          <g key={j.id}>
            {isGK && (
              <circle cx={px} cy={py} r={R + 3} fill="none" stroke="#f1eb4f"
                strokeWidth="1.5" strokeDasharray="3 2" />
            )}
            <circle cx={px} cy={py} r={R} fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
            <text x={px} y={nameY} textAnchor="middle"
              fill="white" stroke="rgba(0,0,0,0.6)" strokeWidth="2.5" paintOrder="stroke"
              fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif">
              {name}
            </text>
          </g>
        );
      });
    }

    const nStripes = 8;
    const stripes = landscape
      ? Array.from({ length: nStripes }, (_, i) => {
          const sw = fw / nStripes;
          return <rect key={i} x={ml + i * sw} y={mt} width={sw} height={fh} fill={i % 2 === 0 ? '#166534' : '#15803d'} />;
        })
      : Array.from({ length: nStripes }, (_, i) => {
          const sh = fh / nStripes;
          return <rect key={i} x={ml} y={mt + i * sh} width={fw} height={sh} fill={i % 2 === 0 ? '#166534' : '#15803d'} />;
        });

    const lines = landscape ? (
      <>
        <rect x={ml} y={mt} width={fw} height={fh} fill="none" stroke="white" strokeWidth="1.5" />
        <line x1={cx} y1={mt} x2={cx} y2={mt + fh} stroke="white" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={36} fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={2.5} fill="white" />
        <rect x={ml}          y={cy - 62} width={66} height={124} fill="none" stroke="white" strokeWidth="1.5" />
        <rect x={ml + fw - 66} y={cy - 62} width={66} height={124} fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx={ml + 50}      cy={cy} r={2} fill="white" />
        <circle cx={ml + fw - 50} cy={cy} r={2} fill="white" />
        <rect x={ml - 11}  y={cy - 30} width={11} height={60} fill="none" stroke="white" strokeWidth="1.5" />
        <rect x={ml + fw}  y={cy - 30} width={11} height={60} fill="none" stroke="white" strokeWidth="1.5" />
      </>
    ) : (
      <>
        <rect x={ml} y={mt} width={fw} height={fh} fill="none" stroke="white" strokeWidth="1.5" />
        <line x1={ml} y1={cy} x2={ml + fw} y2={cy} stroke="white" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={36} fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={2.5} fill="white" />
        <rect x={cx - 62} y={mt}           width={124} height={66} fill="none" stroke="white" strokeWidth="1.5" />
        <rect x={cx - 62} y={mt + fh - 66} width={124} height={66} fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx={cx} cy={mt + 50}      r={2} fill="white" />
        <circle cx={cx} cy={mt + fh - 50} r={2} fill="white" />
        <rect x={cx - 30} y={mt - 11} width={60} height={11} fill="none" stroke="white" strokeWidth="1.5" />
        <rect x={cx - 30} y={mt + fh} width={60} height={11} fill="none" stroke="white" strokeWidth="1.5" />
      </>
    );

    const teamLabels = landscape ? (
      <>
        <text x={ml + hw / 2} y={mt + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="1">{label1}</text>
        <text x={cx + hw / 2} y={mt + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="1">{label2}</text>
      </>
    ) : (
      <>
        <text x={cx} y={cy - 7}  textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="1">{label1}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="1">{label2}</text>
      </>
    );

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className={landscape
          ? 'hidden md:block w-full rounded-xl shadow-lg'
          : 'md:hidden w-full rounded-xl shadow-lg'}
      >
        <rect width={W} height={H} fill="#14532d" rx="8" />
        {stripes}
        {lines}
        {teamLabels}
        {renderEquipo(equipo1, p1, 1, color1)}
        {renderEquipo(equipo2, p2, 2, color2)}
      </svg>
    );
  }

  // ─── Controls ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      {renderSvg(false, svgPortraitRef)}
      {renderSvg(true,  svgLandscapeRef)}

      <div className="space-y-1.5">
        {/* Formation selectors — one per team */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'A', opts: opts1, idx: formIdx1, set: setFormIdx1, color: 'text-slate-500' },
            { label: 'B', opts: opts2, idx: formIdx2, set: setFormIdx2, color: 'text-brand'     },
          ].map(({ label, opts, idx, set }) => (
            opts.length > 1 ? (
              <div key={label} className="flex items-center gap-1 border border-slate-200 bg-white rounded-lg px-2 py-1.5">
                <button
                  onClick={() => set(v => (v - 1 + opts.length) % opts.length)}
                  className="cursor-pointer p-0.5 text-slate-400 hover:text-slate-700 rounded"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="flex-1 text-center text-xs font-mono font-semibold text-slate-600 tracking-wide leading-none">
                  <span className="text-slate-400 font-normal">{label} </span>{opts[Math.min(idx, opts.length - 1)].name}
                </span>
                <button
                  onClick={() => set(v => (v + 1) % opts.length)}
                  className="cursor-pointer p-0.5 text-slate-400 hover:text-slate-700 rounded"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            ) : (
              <div key={label} className="flex items-center justify-center border border-slate-100 bg-slate-50 rounded-lg px-2 py-1.5">
                <span className="text-xs font-mono font-semibold text-slate-400">
                  <span className="font-normal">{label} </span>{opts[0].name}
                </span>
              </div>
            )
          ))}
        </div>

        {/* Invert + Copy */}
        <div className="flex gap-2">
          <button
            onClick={() => setInvertido(v => !v)}
            className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            <ArrowLeftRight size={13} />
            {invertido ? 'A: oscuro · B: claro' : 'A: claro · B: oscuro'}
          </button>
          <button
            onClick={copyImage}
            className={`cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              copied
                ? 'border-brand bg-brand-light text-brand'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {copied ? <Check size={13} /> : <ImageDown size={13} />}
            {copied ? '¡Copiado!' : 'Copiar imagen'}
          </button>
        </div>
      </div>
    </div>
  );
}
