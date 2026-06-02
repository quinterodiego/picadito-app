import { google } from 'googleapis';
import type { Jugador, NivelJugador, Partido } from './types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// ─── Jugadores ────────────────────────────────────────────────────────────────

export async function getJugadores(): Promise<Jugador[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Jugadores!A2:H',
  });
  const rows = res.data.values ?? [];
  return rows
    .filter(row => row[0])
    .map(row => ({
      id: row[0],
      nombre: row[1],
      nivel: (row[2] ?? 'medio') as NivelJugador,
      activo: row[3] === 'TRUE',
      apodo: row[4] ?? '',
      lesionado: row[5] === 'TRUE',
      esArquero: row[6] === 'TRUE',
      puedeAtajarProximo: row[7] === 'TRUE',
    }));
}

export async function addJugador(data: Omit<Jugador, 'id'>): Promise<Jugador> {
  const sheets = await getSheetsClient();
  const id = Date.now().toString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Jugadores!A:H',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, data.nombre, data.nivel, data.activo, data.apodo ?? '', data.lesionado, data.esArquero, data.puedeAtajarProximo]],
    },
  });
  return { id, ...data };
}

export async function updateJugador(jugador: Jugador): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Jugadores!A:A',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === jugador.id);
  if (rowIndex === -1) throw new Error('Jugador no encontrado');
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Jugadores!A${sheetRow}:H${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        jugador.id, jugador.nombre, jugador.nivel, jugador.activo,
        jugador.apodo ?? '', jugador.lesionado, jugador.esArquero, jugador.puedeAtajarProximo,
      ]],
    },
  });
}

export async function deleteJugador(id: string): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Jugadores!A:A',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === id);
  if (rowIndex === -1) throw new Error('Jugador no encontrado');
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `Jugadores!A${sheetRow}:H${sheetRow}`,
  });
}

// ─── Partidos ─────────────────────────────────────────────────────────────────

export async function getPartidos(): Promise<Partido[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Partidos!A2:G',
  });
  const rows = res.data.values ?? [];
  return rows
    .filter(row => row[0])
    .map(row => ({
      id: row[0],
      fecha: row[1],
      equipo1: row[2] ? row[2].split(',') : [],
      equipo2: row[3] ? row[3].split(',') : [],
      goles1: row[4] !== '' && row[4] != null ? parseInt(row[4], 10) : undefined,
      goles2: row[5] !== '' && row[5] != null ? parseInt(row[5], 10) : undefined,
      notas: row[6] ?? '',
    }));
}

export async function addPartido(data: Omit<Partido, 'id'>): Promise<Partido> {
  const sheets = await getSheetsClient();
  const id = Date.now().toString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Partidos!A:G',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        id,
        data.fecha,
        data.equipo1.join(','),
        data.equipo2.join(','),
        data.goles1 ?? '',
        data.goles2 ?? '',
        data.notas ?? '',
      ]],
    },
  });
  return { id, ...data };
}

export async function updatePartido(partido: Partido): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Partidos!A:A',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === partido.id);
  if (rowIndex === -1) throw new Error('Partido no encontrado');
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Partidos!A${sheetRow}:G${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        partido.id,
        partido.fecha,
        partido.equipo1.join(','),
        partido.equipo2.join(','),
        partido.goles1 ?? '',
        partido.goles2 ?? '',
        partido.notas ?? '',
      ]],
    },
  });
}

export async function deletePartido(id: string): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Partidos!A:A',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === id);
  if (rowIndex === -1) throw new Error('Partido no encontrado');
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `Partidos!A${sheetRow}:G${sheetRow}`,
  });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

export async function initSheets(): Promise<void> {
  const sheets = await getSheetsClient();

  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingSheets = sheetMeta.data.sheets?.map(s => s.properties?.title) ?? [];

  const toCreate = [
    { title: 'Jugadores', headers: ['id', 'nombre', 'nivel', 'activo', 'apodo', 'lesionado', 'esArquero', 'puedeAtajarProximo'] },
    { title: 'Partidos', headers: ['id', 'fecha', 'equipo1', 'equipo2', 'goles1', 'goles2', 'notas'] },
  ];

  for (const sheet of toCreate) {
    if (!existingSheets.includes(sheet.title)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheet.title } } }],
        },
      });
    }
    const headersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheet.title}!A1:Z1`,
    });
    if (!headersRes.data.values?.[0]?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheet.title}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [sheet.headers] },
      });
    }
  }
}
