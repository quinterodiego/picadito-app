import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPartidos, addPartido, addJugador } from '@/lib/sheets';

export async function GET() {
  const session = await auth();
  const groupId = session?.user?.groupId;
  if (!groupId) return NextResponse.json({ error: 'Sin grupo' }, { status: 403 });

  try {
    const partidos = await getPartidos(groupId);
    return NextResponse.json(partidos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener partidos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const groupId = session?.user?.groupId;
  if (!groupId) return NextResponse.json({ error: 'Sin grupo' }, { status: 403 });

  try {
    const body = await req.json();

    const invitados: { id: string; nombre: string }[] = body.invitados ?? [];
    const idMap = new Map<string, string>();

    for (const inv of invitados) {
      const creado = await addJugador(groupId, {
        nombre: inv.nombre,
        apodo: '',
        activo: false,
        lesionado: false,
        puedeAtajarProximo: false,
        esInvitado: true,
      });
      idMap.set(inv.id, creado.id);
    }

    const remap = (ids: string[]) => ids.map(id => idMap.get(id) ?? id);

    const partido = await addPartido(groupId, {
      fecha: body.fecha,
      equipo1: remap(body.equipo1),
      equipo2: remap(body.equipo2),
      resultado: body.resultado || undefined,
      notas: body.notas ?? '',
      destacado: body.destacado ?? '',
      rustico: body.rustico ?? '',
      formacion1: body.formacion1 || undefined,
      formacion2: body.formacion2 || undefined,
      posiciones1: body.posiciones1 || undefined,
      posiciones2: body.posiciones2 || undefined,
    });
    return NextResponse.json(partido, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al guardar partido' }, { status: 500 });
  }
}
