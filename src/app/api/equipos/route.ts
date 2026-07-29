import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getJugadores, getPartidos } from '@/lib/sheets';
import { generarEquipos } from '@/lib/team-algorithm';
import type { Jugador } from '@/lib/types';

export async function POST(req: Request) {
  const session = await auth();
  const groupId = session?.user?.groupId;
  if (!groupId) return NextResponse.json({ error: 'Sin grupo' }, { status: 403 });

  try {
    const body = await req.json();
    const asistentesIds: string[] = body.asistentes ?? [];
    const invitadosNombres: string[] = body.invitados ?? [];

    const [todosJugadores, historial] = await Promise.all([
      getJugadores(groupId),
      getPartidos(groupId),
    ]);

    const jugadoresRegulares = todosJugadores.filter(j => asistentesIds.includes(j.id));

    const invitados: Jugador[] = invitadosNombres.map((nombre, i) => ({
      id: `invitado_${i}`,
      nombre,
      apodo: '',
      activo: false,
      lesionado: false,
      esArquero: false,
      puedeAtajarProximo: false,
    }));

    const asistentes = [...jugadoresRegulares, ...invitados];

    if (asistentes.length < 2) {
      return NextResponse.json({ error: 'Se necesitan al menos 2 jugadores' }, { status: 400 });
    }

    const sugerencias = generarEquipos(asistentes, historial);
    return NextResponse.json(sugerencias);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al generar equipos' }, { status: 500 });
  }
}
