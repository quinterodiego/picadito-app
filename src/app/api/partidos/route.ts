import { NextResponse } from 'next/server';
import { getPartidos, addPartido, addJugador } from '@/lib/sheets';

export async function GET() {
  try {
    const partidos = await getPartidos();
    return NextResponse.json(partidos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener partidos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Invitados: { id: 'invitado_N', nombre: '...' }[]
    // Se crean en el Sheet (activo: false) y se remapean sus IDs temporales
    const invitados: { id: string; nombre: string }[] = body.invitados ?? [];
    const idMap = new Map<string, string>(); // invitado_N → ID real del Sheet

    for (const inv of invitados) {
      const creado = await addJugador({
        nombre: inv.nombre,
        apodo: '',
        nivel: 'medio',
        activo: false,
        lesionado: false,
        esArquero: false,
        puedeAtajarProximo: false,
      });
      idMap.set(inv.id, creado.id);
    }

    const remap = (ids: string[]) => ids.map(id => idMap.get(id) ?? id);

    const partido = await addPartido({
      fecha: body.fecha,
      equipo1: remap(body.equipo1),
      equipo2: remap(body.equipo2),
      goles1: body.goles1 !== undefined && body.goles1 !== '' ? Number(body.goles1) : undefined,
      goles2: body.goles2 !== undefined && body.goles2 !== '' ? Number(body.goles2) : undefined,
      notas: body.notas ?? '',
    });
    return NextResponse.json(partido, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al guardar partido' }, { status: 500 });
  }
}
