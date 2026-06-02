export type NivelJugador = 'bajo' | 'semi-medio' | 'medio' | 'semi-alto' | 'alto';

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
  fecha: string; // ISO date YYYY-MM-DD
  equipo1: string[]; // player IDs
  equipo2: string[]; // player IDs
  goles1?: number;   // undefined = sin resultado cargado
  goles2?: number;
  notas?: string;
}

export interface EquipoSugerido {
  equipo1: Jugador[];
  equipo2: Jugador[];
  nivelEquipo1: number;
  nivelEquipo2: number;
  scoreBalance: number;
  scoreRotacion: number;
}

export interface EstadisticaJugador {
  jugador: Jugador;
  partidosJugados: number;
  golesFavor: number;
  golesContra: number;
  victorias: number;
  derrotas: number;
  empates: number;
  companerosFrequentes: { jugador: Jugador; veces: number }[];
  rivalesFrequentes: { jugador: Jugador; veces: number }[];
}
