import { NextResponse } from 'next/server';
import { initSheets } from '@/lib/sheets';

export async function POST() {
  try {
    await initSheets();
    return NextResponse.json({ ok: true, message: 'Sheets inicializadas correctamente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al inicializar sheets' }, { status: 500 });
  }
}
