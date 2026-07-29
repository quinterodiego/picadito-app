export type ResultadoPartido = 'A' | 'B' | 'empate';

export interface Jugador {
  id: string;
  nombre: string;
  apodo?: string;
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
  resultado?: ResultadoPartido;
  notas?: string;
  destacado?: string;
  rustico?: string;
  formacion1?: string;
  formacion2?: string;
  posiciones1?: [number, number][];
  posiciones2?: [number, number][];
}

export interface EquipoSugerido {
  equipo1: Jugador[];
  equipo2: Jugador[];
  scoreBalance: number;
  scoreRotacion: number;
  modoAleatorio: boolean;
}
