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

function buildMatrix(teams: string[][]): Map<string, number> {
  const m = new Map<string, number>();
  for (const ids of teams) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = [ids[i], ids[j]].sort().join('|');
        m.set(key, (m.get(key) ?? 0) + 1);
      }
    }
  }
  return m;
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
  const n      = asistentes.length;
  const mitad  = Math.floor(n / 2);
  const nPairs = (mitad * (mitad - 1)) / 2;

  // Familiarity: todos los partidos
  const famMatrix = buildMatrix([
    ...historial.map(p => p.equipo1),
    ...historial.map(p => p.equipo2),
  ]);

  // Victorias juntos: solo equipos ganadores
  const vitMatrix = buildMatrix(
    historial
      .filter(p => p.resultado === 'A' || p.resultado === 'B')
      .map(p => p.resultado === 'A' ? p.equipo1 : p.equipo2),
  );

  const totalPartidos  = Math.max(historial.length, 1);
  const totalVictorias = Math.max(
    historial.filter(p => p.resultado && p.resultado !== 'empate').length,
    1,
  );
  const maxFam = 2 * nPairs * totalPartidos;
  const maxVit = 2 * nPairs * totalVictorias;

  // Anclar asistentes[0] en eq1 → cada partido aparece exactamente una vez
  const resto = asistentes.slice(1);
  const scored = combinations(resto, mitad - 1).map(c => {
    const eq1  = [asistentes[0], ...c];
    const eq2  = asistentes.filter(j => !eq1.includes(j));
    const ids1 = eq1.map(j => j.id);
    const ids2 = eq2.map(j => j.id);

    const nivel1 = eq1.reduce((s, j) => s + NIVEL_PESO[j.nivel], 0);
    const nivel2 = eq2.reduce((s, j) => s + NIVEL_PESO[j.nivel], 0);

    // Balance de nivel: solo desempate, peso muy bajo
    const scoreBalance = Math.abs(nivel1 - nivel2) / Math.max(nivel1, nivel2, 1);

    // Rotación: cuánto han jugado juntos estos pares
    const scoreRotacion = (pairScore(ids1, famMatrix) + pairScore(ids2, famMatrix)) / maxFam;

    // Victorias juntos: cuántas veces ganaron juntos (penaliza más)
    const scoreVictorias = (pairScore(ids1, vitMatrix) + pairScore(ids2, vitMatrix)) / maxVit;

    // Score final: historial manda, nivel es desempate (peso 5%)
    const scoreTotal = scoreRotacion + 2 * scoreVictorias + 0.05 * scoreBalance;

    return { eq1, eq2, nivel1, nivel2, scoreBalance, scoreRotacion, scoreVictorias, scoreTotal };
  });

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
