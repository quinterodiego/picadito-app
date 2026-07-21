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

// Cuenta co-ocurrencias de pares en los teams dados
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

// Suma de co-ocurrencias de todos los pares dentro de un equipo
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
  const nPairs = (mitad * (mitad - 1)) / 2; // C(mitad, 2)

  // Matriz de familiaridad: todas las veces que cada par jugó junto
  const famMatrix = buildMatrix([
    ...historial.map(p => p.equipo1),
    ...historial.map(p => p.equipo2),
  ]);

  // Matriz de victorias: solo los equipos que ganaron
  const vitMatrix = buildMatrix(
    historial
      .filter(p => p.resultado === 'A' || p.resultado === 'B')
      .map(p => p.resultado === 'A' ? p.equipo1 : p.equipo2),
  );

  const totalPartidos  = Math.max(historial.length, 1);
  const totalVictorias = Math.max(historial.filter(p => p.resultado && p.resultado !== 'empate').length, 1);
  const maxFam = 2 * nPairs * totalPartidos;
  const maxVit = 2 * nPairs * totalVictorias;

  const scored = combinations(asistentes, mitad).map(eq1 => {
    const eq2  = asistentes.filter(j => !eq1.includes(j));
    const ids1 = eq1.map(j => j.id);
    const ids2 = eq2.map(j => j.id);

    const nivel1 = eq1.reduce((s, j) => s + NIVEL_PESO[j.nivel], 0);
    const nivel2 = eq2.reduce((s, j) => s + NIVEL_PESO[j.nivel], 0);

    // Balance: diferencia de niveles (0 = perfecto, mayor = más desbalanceado)
    const scoreBalance = Math.abs(nivel1 - nivel2) / Math.max(nivel1, nivel2, 1);

    // Rotación: cuánto han jugado juntos estos pares en general (mayor = más repetido)
    const scoreRotacion = (pairScore(ids1, famMatrix) + pairScore(ids2, famMatrix)) / maxFam;

    // Victorias juntos: cuántas veces ganaron juntos estos pares (mayor = más ventaja acumulada)
    const scoreVictorias = (pairScore(ids1, vitMatrix) + pairScore(ids2, vitMatrix)) / maxVit;

    return { eq1, eq2, nivel1, nivel2, scoreBalance, scoreRotacion, scoreVictorias };
  });

  // Paso 1: ordenar por balance y tomar el pool de las más balanceadas
  scored.sort((a, b) => a.scoreBalance - b.scoreBalance);
  const POOL_SIZE = Math.min(30, scored.length);
  const pool = scored.slice(0, POOL_SIZE);

  // Paso 2: dentro del pool balanceado, ordenar por rotación + victorias juntos
  // (menor = pares que menos han jugado juntos y menos han ganado juntos → más variado)
  pool.sort((a, b) =>
    (a.scoreRotacion + a.scoreVictorias) - (b.scoreRotacion + b.scoreVictorias),
  );

  return pool.slice(0, 3).map(s => ({
    equipo1: s.eq1,
    equipo2: s.eq2,
    nivelEquipo1: s.nivel1,
    nivelEquipo2: s.nivel2,
    scoreBalance: s.scoreBalance,
    scoreRotacion: s.scoreRotacion,
  }));
}
