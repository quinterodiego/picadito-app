export type NivelJugador = 'bajo' | 'semi-medio' | 'medio' | 'semi-alto' | 'alto';

export type ResultadoPartido = 'A' | 'B' | 'empate';

export interface Jugador {
  id: string;
  nombre: string;
  apodo?: string;
  nivel: NivelJugador;
  activo: boolean;
  lesionado: boolean;
  esArquero: boolean;
  puedeAtajarProximo: boolean;
}

export interface Partido {
  id: string;
  fecha: string;
  equipo1: string[];
  equipo2: string[];
  resultado?: ResultadoPartido; // undefined = sin resultado cargado
  notas?: string;
  destacado?: string; // player ID
  rustico?: string;   // player ID
  formacion1?: string; // e.g. "1-3-3-1"
  formacion2?: string;
  posiciones1?: [number, number][]; // normalized (xr, yr) per player
  posiciones2?: [number, number][];
}

export interface EquipoSugerido {
  equipo1: Jugador[];
  equipo2: Jugador[];
  nivelEquipo1: number;
  nivelEquipo2: number;
  scoreBalance: number;
  scoreRotacion: number;
}
