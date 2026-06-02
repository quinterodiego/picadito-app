import type { Jugador, NivelJugador, Partido, EquipoSugerido } from './types';

const NIVEL_PESO: Record<NivelJugador, number> = {
  'bajo': 1, 'semi-medio': 2, 'medio': 3, 'semi-alto': 4, 'alto': 5,
};

// Calcula todas las combinaciones de tamaño k del array
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

// Construye una matriz de familiaridad: cuántas veces cada par jugó junto
function buildFamiliaridadMatrix(
  jugadores: Jugador[],
  historial: Partido[]
): Map<string, number> {
  const matrix = new Map<string, number>();

  for (const partido of historial) {
    const equipos = [partido.equipo1, partido.equipo2];
    for (const equipo of equipos) {
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

// Calcula la familiaridad total dentro de un equipo
function familiaridadEquipo(ids: string[], matrix: Map<string, number>): number {
  let total = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const key = [ids[i], ids[j]].sort().join('|');
      total += matrix.get(key) ?? 0;
    }
  }
  return total;
}

export function generarEquipos(
  asistentes: Jugador[],
  historial: Partido[],
  opciones = { pesoBalance: 0.6, pesoRotacion: 0.4 }
): EquipoSugerido[] {
  const n = asistentes.length;
  const mitad = Math.floor(n / 2);

  const matrix = buildFamiliaridadMatrix(asistentes, historial);

  const todasCombinaciones = combinations(asistentes, mitad);

  const scored = todasCombinaciones.map(equipo1 => {
    const equipo2 = asistentes.filter(j => !equipo1.includes(j));
    const nivel1 = equipo1.reduce((s, j) => s + NIVEL_PESO[j.nivel], 0);
    const nivel2 = equipo2.reduce((s, j) => s + NIVEL_PESO[j.nivel], 0);

    // Score balance: diferencia de niveles normalizada (0 = perfecto)
    const maxDiff = Math.max(nivel1, nivel2, 1);
    const scoreBalance = Math.abs(nivel1 - nivel2) / maxDiff;

    // Score rotación: familiaridad total dentro de ambos equipos normalizada
    const famE1 = familiaridadEquipo(equipo1.map(j => j.id), matrix);
    const famE2 = familiaridadEquipo(equipo2.map(j => j.id), matrix);
    const famTotal = famE1 + famE2;
    const maxFam = historial.length * mitad || 1;
    const scoreRotacion = famTotal / maxFam;

    const scoreTotal =
      opciones.pesoBalance * scoreBalance + opciones.pesoRotacion * scoreRotacion;

    return { equipo1, equipo2, nivel1, nivel2, scoreBalance, scoreRotacion, scoreTotal };
  });

  // Ordenar por score total (menor = mejor), devolver top 3
  scored.sort((a, b) => a.scoreTotal - b.scoreTotal);

  return scored.slice(0, 3).map(s => ({
    equipo1: s.equipo1,
    equipo2: s.equipo2,
    nivelEquipo1: s.nivel1,
    nivelEquipo2: s.nivel2,
    scoreBalance: s.scoreBalance,
    scoreRotacion: s.scoreRotacion,
  }));
}
