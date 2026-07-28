import { google } from 'googleapis';
import type { Jugador, NivelJugador, Partido } from './types';

export interface GrupoConfig {
  id: string;
  nombre: string;
  imagen: string;
  inviteCode: string;
  adminId: string;
}

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

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function getOrCreateUsuario(email: string, nombre: string): Promise<string> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Usuarios!A2:D',
  });
  const rows = res.data.values ?? [];
  const existing = rows.find(r => r[1] === email);
  if (existing) return existing[0];

  const id = Date.now().toString();
  const createdAt = new Date().toISOString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Usuarios!A:D',
    valueInputOption: 'RAW',
    requestBody: { values: [[id, email, nombre, createdAt]] },
  });
  return id;
}

export async function getMiembroGrupo(userId: string): Promise<{ groupId: string; role: string } | null> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Miembros!A2:D',
  });
  const rows = res.data.values ?? [];
  const row = rows.find(r => r[1] === userId);
  if (!row) return null;
  return { groupId: row[0], role: row[2] };
}

export async function addMiembro(groupId: string, userId: string, role: string): Promise<void> {
  const sheets = await getSheetsClient();
  const joinedAt = new Date().toISOString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Miembros!A:D',
    valueInputOption: 'RAW',
    requestBody: { values: [[groupId, userId, role, joinedAt]] },
  });
}

// ─── Grupos ───────────────────────────────────────────────────────────────────

export async function createGrupo(data: { nombre: string; adminId: string }): Promise<{ id: string; inviteCode: string }> {
  const sheets = await getSheetsClient();
  const id = Date.now().toString();
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const createdAt = new Date().toISOString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Grupos!A:F',
    valueInputOption: 'RAW',
    requestBody: { values: [[id, data.nombre, '', inviteCode, data.adminId, createdAt]] },
  });
  return { id, inviteCode };
}

export async function getGrupo(groupId: string): Promise<GrupoConfig> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Grupos!A2:E',
  });
  const rows = res.data.values ?? [];
  const row = rows.find(r => r[0] === groupId);
  if (!row) throw new Error('Grupo no encontrado');
  return {
    id: row[0],
    nombre: row[1] ?? '',
    imagen: row[2] ?? '',
    inviteCode: row[3] ?? '',
    adminId: row[4] ?? '',
  };
}

export async function updateGrupo(groupId: string, data: { nombre?: string; imagen?: string }): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Grupos!A:A',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === groupId);
  if (rowIndex === -1) throw new Error('Grupo no encontrado');
  const sheetRow = rowIndex + 1;

  if (data.nombre !== undefined) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Grupos!B${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[data.nombre]] },
    });
  }
  if (data.imagen !== undefined) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Grupos!C${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[data.imagen]] },
    });
  }
}

export async function unirseConCodigo(inviteCode: string, userId: string): Promise<{ groupId: string } | null> {
  const sheets = await getSheetsClient();
  const gruposRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Grupos!A2:F',
  });
  const gruposRows = gruposRes.data.values ?? [];
  const grupoRow = gruposRows.find(r => r[3] === inviteCode);
  if (!grupoRow) return null;

  const groupId = grupoRow[0];

  const miembrosRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Miembros!A2:D',
  });
  const miembrosRows = miembrosRes.data.values ?? [];
  const alreadyMember = miembrosRows.some(r => r[0] === groupId && r[1] === userId);
  if (alreadyMember) return { groupId };

  await addMiembro(groupId, userId, 'member');
  return { groupId };
}

// ─── Jugadores ────────────────────────────────────────────────────────────────
// Schema: A=id, B=nombre, C=nivel, D=activo, E=apodo, F=lesionado, G=esArquero, H=puedeAtajarProximo, I=group_id

export async function getJugadores(groupId: string): Promise<Jugador[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Jugadores!A2:I',
  });
  const rows = res.data.values ?? [];
  return rows
    .filter(row => row[0] && row[8] === groupId)
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

export async function addJugador(groupId: string, data: Omit<Jugador, 'id'>): Promise<Jugador> {
  const sheets = await getSheetsClient();
  const id = Date.now().toString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Jugadores!A:I',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        id, data.nombre, data.nivel, data.activo,
        data.apodo ?? '', data.lesionado, data.esArquero, data.puedeAtajarProximo,
        groupId,
      ]],
    },
  });
  return { id, ...data };
}

export async function updateJugador(groupId: string, jugador: Jugador): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Jugadores!A:I',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === jugador.id && r[8] === groupId);
  if (rowIndex === -1) throw new Error('Jugador no encontrado');
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Jugadores!A${sheetRow}:I${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        jugador.id, jugador.nombre, jugador.nivel, jugador.activo,
        jugador.apodo ?? '', jugador.lesionado, jugador.esArquero, jugador.puedeAtajarProximo,
        groupId,
      ]],
    },
  });
}

export async function deleteJugador(groupId: string, id: string): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Jugadores!A:I',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === id && r[8] === groupId);
  if (rowIndex === -1) throw new Error('Jugador no encontrado');
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `Jugadores!A${sheetRow}:I${sheetRow}`,
  });
}

// ─── Partidos ─────────────────────────────────────────────────────────────────
// Schema: A=id, B=fecha, C=equipo1, D=equipo2, E=resultado, F=notas, G=destacado,
//         H=rustico, I=formacion1, J=formacion2, K=posiciones1, L=posiciones2, M=group_id

export async function getPartidos(groupId: string): Promise<Partido[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Partidos!A2:M',
  });
  const rows = res.data.values ?? [];
  return rows
    .filter(row => row[0] && row[12] === groupId)
    .map(row => ({
      id: row[0],
      fecha: row[1],
      equipo1: row[2] ? row[2].split(',') : [],
      equipo2: row[3] ? row[3].split(',') : [],
      resultado: (row[4] || undefined) as Partido['resultado'],
      notas: row[5] ?? '',
      destacado: row[6] ?? '',
      rustico: row[7] ?? '',
      formacion1: row[8] || undefined,
      formacion2: row[9] || undefined,
      posiciones1: row[10] ? JSON.parse(row[10]) : undefined,
      posiciones2: row[11] ? JSON.parse(row[11]) : undefined,
    }));
}

export async function addPartido(groupId: string, data: Omit<Partido, 'id'>): Promise<Partido> {
  const sheets = await getSheetsClient();
  const id = Date.now().toString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Partidos!A:M',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        id,
        data.fecha,
        data.equipo1.join(','),
        data.equipo2.join(','),
        data.resultado ?? '',
        data.notas ?? '',
        data.destacado ?? '',
        data.rustico ?? '',
        data.formacion1 ?? '',
        data.formacion2 ?? '',
        data.posiciones1 ? JSON.stringify(data.posiciones1) : '',
        data.posiciones2 ? JSON.stringify(data.posiciones2) : '',
        groupId,
      ]],
    },
  });
  return { id, ...data };
}

export async function updatePartido(groupId: string, partido: Partido): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Partidos!A:M',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === partido.id && r[12] === groupId);
  if (rowIndex === -1) throw new Error('Partido no encontrado');
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Partidos!A${sheetRow}:M${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        partido.id,
        partido.fecha,
        partido.equipo1.join(','),
        partido.equipo2.join(','),
        partido.resultado ?? '',
        partido.notas ?? '',
        partido.destacado ?? '',
        partido.rustico ?? '',
        partido.formacion1 ?? '',
        partido.formacion2 ?? '',
        partido.posiciones1 ? JSON.stringify(partido.posiciones1) : '',
        partido.posiciones2 ? JSON.stringify(partido.posiciones2) : '',
        groupId,
      ]],
    },
  });
}

export async function deletePartido(groupId: string, id: string): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Partidos!A:M',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === id && r[12] === groupId);
  if (rowIndex === -1) throw new Error('Partido no encontrado');
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `Partidos!A${sheetRow}:M${sheetRow}`,
  });
}

// ─── Setup + Migration ────────────────────────────────────────────────────────

// Creates Usuarios/Grupos/Miembros tabs and adds group_id headers to Jugadores/Partidos.
// Does NOT create any group or migrate data — call migrateExistingDataToGroup for that.
export async function initSheets(): Promise<void> {
  const sheets = await getSheetsClient();

  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingSheets = sheetMeta.data.sheets?.map(s => s.properties?.title) ?? [];

  const newTabs = [
    { title: 'Usuarios', headers: ['id', 'email', 'nombre', 'created_at'] },
    { title: 'Grupos', headers: ['id', 'nombre', 'imagen', 'invite_code', 'admin_id', 'created_at'] },
    { title: 'Miembros', headers: ['group_id', 'user_id', 'role', 'joined_at'] },
  ];

  for (const tab of newTabs) {
    if (!existingSheets.includes(tab.title)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: tab.title } } }],
        },
      });
    }
    const headersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tab.title}!A1:Z1`,
    });
    if (!headersRes.data.values?.[0]?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${tab.title}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [tab.headers] },
      });
    }
  }

  // Ensure Jugadores has group_id header at col I, Partidos at col M
  const headerChecks: { tab: string; col: string; header: string }[] = [
    { tab: 'Jugadores', col: 'I1', header: 'group_id' },
    { tab: 'Partidos',  col: 'M1', header: 'group_id' },
  ];
  for (const { tab, col, header } of headerChecks) {
    if (existingSheets.includes(tab)) {
      const hRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${tab}!${col}`,
      });
      if (!hRes.data.values?.[0]?.[0]) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${tab}!${col}`,
          valueInputOption: 'RAW',
          requestBody: { values: [[header]] },
        });
      }
    }
  }
}

// Assigns rows that have no group_id to the given groupId.
// Used at group-creation time for the first user.
export async function migrateExistingDataToGroup(groupId: string): Promise<{ jugadores: number; partidos: number }> {
  return migrateOrphanedDataToGroup(groupId);
}

// Assigns rows that have no group_id OR belong to a group that no longer exists
// (orphaned by a previous failed migration) to the given groupId.
// Safe for multi-tenant: rows belonging to a valid group are never touched.
export async function migrateOrphanedDataToGroup(groupId: string): Promise<{ jugadores: number; partidos: number }> {
  const sheets = await getSheetsClient();

  // Collect all currently valid group IDs
  const gruposRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Grupos!A2:A',
  });
  const validGroupIds = new Set(
    (gruposRes.data.values ?? []).map(r => r[0]).filter(Boolean)
  );

  let jugadoresMigrated = 0;
  let partidosMigrated = 0;

  const jugRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Jugadores!A2:I',
  });
  for (const [idx, row] of (jugRes.data.values ?? []).entries()) {
    if (row[0] && (!row[8] || !validGroupIds.has(row[8]))) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Jugadores!I${idx + 2}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[groupId]] },
      });
      jugadoresMigrated++;
    }
  }

  const parRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Partidos!A2:M',
  });
  for (const [idx, row] of (parRes.data.values ?? []).entries()) {
    if (row[0] && (!row[12] || !validGroupIds.has(row[12]))) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Partidos!M${idx + 2}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[groupId]] },
      });
      partidosMigrated++;
    }
  }

  return { jugadores: jugadoresMigrated, partidos: partidosMigrated };
}
