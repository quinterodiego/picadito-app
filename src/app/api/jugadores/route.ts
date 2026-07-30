import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getJugadores, addJugador } from '@/lib/sheets';

export async function GET() {
  const session = await auth();
  const groupId = session?.user?.groupId;
  if (!groupId) return NextResponse.json({ error: 'Sin grupo' }, { status: 403 });

  try {
    const jugadores = await getJugadores(groupId);
    return NextResponse.json(jugadores);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener jugadores' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const groupId = session?.user?.groupId;
  if (!groupId) return NextResponse.json({ error: 'Sin grupo' }, { status: 403 });

  try {
    const body = await req.json();
    const jugador = await addJugador(groupId, {
      nombre: body.nombre,
      apodo: body.apodo ?? '',
      puesto: body.puesto ?? undefined,
      activo: body.activo ?? true,
      lesionado: body.lesionado ?? false,
      puedeAtajarProximo: body.puedeAtajarProximo ?? false,
      esInvitado: body.esInvitado ?? false,
    });
    return NextResponse.json(jugador, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al agregar jugador' }, { status: 500 });
  }
}
