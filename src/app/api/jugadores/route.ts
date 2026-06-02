import { NextResponse } from 'next/server';
import { getJugadores, addJugador } from '@/lib/sheets';

export async function GET() {
  try {
    const jugadores = await getJugadores();
    return NextResponse.json(jugadores);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener jugadores' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const jugador = await addJugador({
      nombre: body.nombre,
      apodo: body.apodo ?? '',
      nivel: body.nivel,
      activo: body.activo ?? true,
      lesionado: body.lesionado ?? false,
      esArquero: body.esArquero ?? false,
      puedeAtajarProximo: body.puedeAtajarProximo ?? false,
    });
    return NextResponse.json(jugador, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al agregar jugador' }, { status: 500 });
  }
}
