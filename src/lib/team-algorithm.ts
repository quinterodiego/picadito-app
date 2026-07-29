import type { Jugador, Partido, EquipoSugerido } from './types';

// Mínimo de partidos con resultado antes de activar el balanceo histórico
const HISTORIAL_THRESHOLD = 5;

// ─── Win-rate por jugador ──────────────────────────────────────────────────────

function buildWinRateMap(historial: Partido[]): Map<string, number> {
  const stats = new Map<string, { wins: number; draws: number; games: number }>();

  for (const partido of historial) {
    if (!partido.resultado) continue;

    for (const id of partido.equipo1) {
      if (!stats.has(id)) stats.set(id, { wins: 0, draws: 0, games: 0 });
      const s = stats.get(id)!;
      s.games++;
      if (partido.resultado === 'A') s.wins++;
      else if (partido.resultado === 'empate') s.draws++;
    }

    for (const id of partido.equipo2) {
      if (!stats.has(id)) stats.set(id, { wins: 0, draws: 0, games: 0 });
      const s = stats.get(id)!;
      s.games++;
      if (partido.resultado === 'B') s.wins++;
      else if (partido.resultado === 'empate') s.draws++;
    }
  }

  const map = new Map<string, number>();
  for (const [id, s] of stats) {
    // Puntos por partido: W=3, E=1, L=0 → rango 0–3
    map.set(id, (s.wins * 3 + s.draws) / s.games);
  }
  return map;
}

// Jugadores sin historial reciben 1.5 (valor medio del rango 0–3)
function getScore(id: string, winRates: Map<string, number>): number {
  return winRates.get(id) ?? 1.5;
}

// ─── Matriz de familiaridad (rotación) ────────────────────────────────────────

function buildFamiliaridadMatrix(historial: Partido[]): Map<string, number> {
  const matrix = new Map<string, number>();
  for (const partido of historial) {
    for (const equipo of [partido.equipo1, partido.equipo2]) {
      for (let i = 0; i < equipo.length; i++) {
        for (let j = i + 1; j < equipo.length; j++) {
          const key = [equipo[i], equipo[j]].sort().join('|');
          matrix.set(key, (matrix.get(key) ?? 0) + 1);
        }
      }
    }
  }
  return matrix;
}

function pairScore(ids: string[], matrix: Map<string, number>): number {
  let s = 0;
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      s += matrix.get([ids[i], ids[j]].sort().join('|')) ?? 0;
  return s;
}

// ─── Combinaciones ────────────────────────────────────────────────────────────

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

// ─── Aleatorización ───────────────────────────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomSplit(asistentes: Jugador[]): EquipoSugerido {
  const s = shuffled(asistentes);
  const mitad = Math.floor(s.length / 2);
  return {
    equipo1: s.slice(0, mitad),
    equipo2: s.slice(mitad),
    scoreBalance: 0,
    scoreRotacion: 0,
    modoAleatorio: true,
  };
}

// ─── Función principal ────────────────────────────────────────────────────────

export function generarEquipos(
  asistentes: Jugador[],
  historial: Partido[],
): EquipoSugerido[] {
  const partidosConResultado = historial.filter(p => p.resultado);

  // Fase 1: sin suficiente historial → aleatorio
  if (partidosConResultado.length < HISTORIAL_THRESHOLD) {
    return [randomSplit(asistentes), randomSplit(asistentes), randomSplit(asistentes)];
  }

  // Fase 2: balanceo por win-rate + rotación
  const winRates = buildWinRateMap(historial);
  const familiaridadMatrix = buildFamiliaridadMatrix(historial);

  const n = asistentes.length;
  const mitad = Math.floor(n / 2);
  const mitad2 = n - mitad;

  const maxPares = (mitad * (mitad - 1)) / 2 + (mitad2 * (mitad2 - 1)) / 2;
  const maxFam = historial.length * maxPares || 1;

  type ScoredSplit = {
    eq1: Jugador[];
    eq2: Jugador[];
    scoreBalance: number;
    scoreRotacion: number;
    scoreTotal: number;
  };

  const vistas = new Set<string>();
  const scored: ScoredSplit[] = [];

  for (const equipo1 of combinations(asistentes, mitad)) {
    const equipo2 = asistentes.filter(j => !equipo1.includes(j));

    const ids1 = equipo1.map(j => j.id).sort().join(',');
    const ids2 = equipo2.map(j => j.id).sort().join(',');
    const canonKey = [ids1, ids2].sort().join('||');
    if (vistas.has(canonKey)) continue;
    vistas.add(canonKey);

    const score1 = equipo1.reduce((s, j) => s + getScore(j.id, winRates), 0);
    const score2 = equipo2.reduce((s, j) => s + getScore(j.id, winRates), 0);

    // 0 = perfectamente balanceado en win-rate
    const scoreBalance = Math.abs(score1 - score2) / Math.max(score1, score2, 0.1);

    // Baja familiaridad = más rotación de compañeros
    const famTotal =
      pairScore(equipo1.map(j => j.id), familiaridadMatrix) +
      pairScore(equipo2.map(j => j.id), familiaridadMatrix);
    const scoreRotacion = famTotal / maxFam;

    // Balance tiene más peso (70%) que rotación (30%)
    const scoreTotal = 0.7 * scoreBalance + 0.3 * scoreRotacion;

    scored.push({ eq1: equipo1, eq2: equipo2, scoreBalance, scoreRotacion, scoreTotal });
  }

  scored.sort((a, b) => a.scoreTotal - b.scoreTotal);

  const top = scored.slice(0, 3);

  return top.map(s => ({
    equipo1: s.eq1,
    equipo2: s.eq2,
    scoreBalance: s.scoreBalance,
    scoreRotacion: s.scoreRotacion,
    modoAleatorio: false,
  }));
}

export { HISTORIAL_THRESHOLD };
