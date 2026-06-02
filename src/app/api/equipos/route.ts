import { NextResponse } from 'next/server';
import { getJugadores, getPartidos } from '@/lib/sheets';
import { generarEquipos } from '@/lib/team-algorithm';
import type { Jugador } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const asistentesIds: string[] = body.asistentes ?? [];
    const invitadosNombres: string[] = body.invitados ?? [];

    const [todosJugadores, historial] = await Promise.all([
      getJugadores(),
      getPartidos(),
    ]);

    const jugadoresRegulares = todosJugadores.filter(j => asistentesIds.includes(j.id));

    // Invitados: jugadores temporales con ID "invitado_N" y nivel medio
    const invitados: Jugador[] = invitadosNombres.map((nombre, i) => ({
      id: `invitado_${i}`,
      nombre,
      apodo: '',
      nivel: 'medio',
      activo: false,
      lesionado: false,
      esArquero: false,
      puedeAtajarProximo: false,
    }));

    const asistentes = [...jugadoresRegulares, ...invitados];

    if (asistentes.length < 2) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 2 jugadores' },
        { status: 400 }
      );
    }

    const sugerencias = generarEquipos(asistentes, historial);
    return NextResponse.json(sugerencias);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al generar equipos' }, { status: 500 });
  }
}
