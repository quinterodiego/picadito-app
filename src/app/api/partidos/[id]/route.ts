import { NextResponse } from 'next/server';
import { updatePartido, deletePartido } from '@/lib/sheets';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await updatePartido({
      id,
      fecha: body.fecha,
      equipo1: body.equipo1,
      equipo2: body.equipo2,
      goles1: body.goles1 !== undefined && body.goles1 !== '' ? Number(body.goles1) : undefined,
      goles2: body.goles2 !== undefined && body.goles2 !== '' ? Number(body.goles2) : undefined,
      notas: body.notas ?? '',
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar partido' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deletePartido(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar partido' }, { status: 500 });
  }
}
