import type { Jugador, NivelJugador, Partido, EquipoSugerido } from './types';

const NIVEL_PESO: Record<NivelJugador, number> = {
  'bajo': 1, 'semi-medio': 2, 'medio': 3, 'semi-alto': 4, 'alto': 5,
};

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

// Construye una matriz de familiaridad: cuántas veces cada par jugó junto
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

export function generarEquipos(
  asistentes: Jugador[],
  historial: Partido[],
): EquipoSugerido[] {
  const n = asistentes.length;
  const mitad = Math.floor(n / 2);
  const mitad2 = n - mitad;

  const matrix = buildFamiliaridadMatrix(historial);

  // Máximo teórico de familiaridad: todos los pares de cada equipo jugaron juntos en todos los partidos
  const maxPares = (mitad * (mitad - 1)) / 2 + (mitad2 * (mitad2 - 1)) / 2;
  const maxFam = historial.length * maxPares || 1;

  type ScoredSplit = { eq1: Jugador[]; eq2: Jugador[]; nivel1: number; nivel2: number; scoreBalance: number; scoreRotacion: number; scoreTotal: number };
  const vistas = new Set<string>();
  const scored: ScoredSplit[] = [];

  for (const equipo1 of combinations(asistentes, mitad)) {
    const equipo2 = asistentes.filter(j => !equipo1.includes(j));

    // Deduplicar splits simétricos: [A,B,C | D,E,F] == [D,E,F | A,B,C]
    const ids1 = equipo1.map(j => j.id).sort().join(',');
    const ids2 = equipo2.map(j => j.id).sort().join(',');
    const canonKey = [ids1, ids2].sort().join('||');
    if (vistas.has(canonKey)) continue;
    vistas.add(canonKey);

    const nivel1 = equipo1.reduce((s, j) => s + NIVEL_PESO[j.nivel], 0);
    const nivel2 = equipo2.reduce((s, j) => s + NIVEL_PESO[j.nivel], 0);

    // Score balance: diferencia de niveles normalizada (0 = perfecto)
    const scoreBalance = Math.abs(nivel1 - nivel2) / Math.max(nivel1, nivel2, 1);

    // Score rotación: familiaridad total dentro de ambos equipos normalizada a [0, 1]
    const famTotal =
      pairScore(equipo1.map(j => j.id), matrix) +
      pairScore(equipo2.map(j => j.id), matrix);
    const scoreRotacion = famTotal / maxFam;

    // Score final: rotación manda, nivel es desempate (peso 5%)
    const scoreTotal = scoreRotacion + 0.05 * scoreBalance;

    scored.push({ eq1: equipo1, eq2: equipo2, nivel1, nivel2, scoreBalance, scoreRotacion, scoreTotal });
  }

  scored.sort((a, b) => a.scoreTotal - b.scoreTotal);

  return scored.slice(0, 3).map(s => ({
    equipo1: s.eq1,
    equipo2: s.eq2,
    nivelEquipo1: s.nivel1,
    nivelEquipo2: s.nivel2,
    scoreBalance: s.scoreBalance,
    scoreRotacion: s.scoreRotacion,
  }));
}
