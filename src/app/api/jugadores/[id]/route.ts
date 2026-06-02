import { NextResponse } from 'next/server';
import { getJugadores, updateJugador, deleteJugador } from '@/lib/sheets';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await updateJugador({
      id,
      nombre: body.nombre,
      apodo: body.apodo ?? '',
      nivel: body.nivel,
      activo: body.activo,
      lesionado: body.lesionado ?? false,
      esArquero: body.esArquero ?? false,
      puedeAtajarProximo: body.puedeAtajarProximo ?? false,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar jugador' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteJugador(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar jugador' }, { status: 500 });
  }
}
