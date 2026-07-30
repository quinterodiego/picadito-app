import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateJugador, deleteJugador } from '@/lib/sheets';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const groupId = session?.user?.groupId;
  if (!groupId) return NextResponse.json({ error: 'Sin grupo' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    await updateJugador(groupId, {
      id,
      nombre: body.nombre,
      apodo: body.apodo ?? '',
      puesto: body.puesto ?? undefined,
      activo: body.activo,
      lesionado: body.lesionado ?? false,
      puedeAtajarProximo: body.puedeAtajarProximo ?? false,
      esInvitado: body.esInvitado ?? false,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar jugador' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const groupId = session?.user?.groupId;
  if (!groupId) return NextResponse.json({ error: 'Sin grupo' }, { status: 403 });

  try {
    const { id } = await params;
    await deleteJugador(groupId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar jugador' }, { status: 500 });
  }
}
