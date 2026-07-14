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
      resultado: body.resultado || undefined,
      notas: body.notas ?? '',
      destacado: body.destacado ?? '',
      rustico: body.rustico ?? '',
      formacion1: body.formacion1 || undefined,
      formacion2: body.formacion2 || undefined,
      posiciones1: body.posiciones1 || undefined,
      posiciones2: body.posiciones2 || undefined,
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
