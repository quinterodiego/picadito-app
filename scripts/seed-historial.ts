import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

// Alias para nombres que difieren entre la lista y la app
const ALIASES: Record<string, string> = {
  'claudio':  'negro claudio',
  'andres':   'pulpo',
};

const HISTORIAL = [
  {
    fecha: '2026-05-05',
    equipo1: ['Juan', 'Juanqui', 'Claudio', 'Sergio', 'Pocho'],
    equipo2: ['Jorgito', 'Seba', 'Diego', 'Alan', 'Andres'],
  },
  {
    fecha: '2026-05-12',
    equipo1: ['Jorgito', 'Pela', 'Pablo', 'Pocho', 'Alan', 'Hernan'],
    equipo2: ['Pulpo', 'Juanqui', 'Sergio', 'Nico', 'Seba', 'Lauty'],
  },
  {
    fecha: '2026-05-19',
    equipo1: ['Juan', 'Juanqui', 'Diego', 'Pablo', 'Pocho', 'Nico'],
    equipo2: ['Jorgito', 'Pela', 'Sergio', 'Alan', 'Lauty', 'Seba'],
  },
  {
    fecha: '2026-05-26',
    equipo1: ['Julio', 'Sergio', 'Juanqui', 'Alan', 'Jorgito', 'Nico'],
    equipo2: ['Pulpo', 'Pablo', 'Diego', 'Pocho', 'Lauty', 'Seba'],
  },
];

const FECHAS_SEED = new Set(HISTORIAL.map(p => p.fecha));

async function main() {
  const { getJugadores, getPartidos, addPartido, deletePartido, getMiembroGrupo, getOrCreateUsuario } = await import('../src/lib/sheets');

  // Resolve groupId from admin email in env
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@setup.local';
  const adminId = await getOrCreateUsuario(adminEmail, 'Admin');
  const miembro = await getMiembroGrupo(adminId);
  if (!miembro) {
    console.error('No se encontró un grupo para el admin. Corrí POST /api/setup primero.');
    process.exit(1);
  }
  const { groupId } = miembro;
  console.log(`Usando grupo: ${groupId}\n`);

  // Borrar partidos previos de estas fechas (evita duplicados al re-correr)
  const existentes = await getPartidos(groupId);
  const aEliminar = existentes.filter(p => FECHAS_SEED.has(p.fecha));
  if (aEliminar.length > 0) {
    console.log(`Eliminando ${aEliminar.length} partidos previos de las mismas fechas...`);
    for (const p of aEliminar) await deletePartido(groupId, p.id);
  }

  const jugadores = await getJugadores(groupId);
  console.log(`${jugadores.length} jugadores en la app\n`);

  function findId(name: string): string | null {
    const lower = name.toLowerCase().trim();
    const resolved = ALIASES[lower] ?? lower;
    const found = jugadores.find(
      j =>
        j.nombre.toLowerCase().trim() === resolved ||
        (j.apodo && j.apodo.toLowerCase().trim() === resolved)
    );
    if (!found) {
      console.warn(`  ⚠️  No encontrado: "${name}" (buscado como "${resolved}")`);
      return null;
    }
    return found.id;
  }

  for (const p of HISTORIAL) {
    const e1 = p.equipo1.map(findId).filter((id): id is string => id !== null);
    const e2 = p.equipo2.map(findId).filter((id): id is string => id !== null);
    await addPartido(groupId, { fecha: p.fecha, equipo1: e1, equipo2: e2 });
    console.log(`✓ ${p.fecha}  [${p.equipo1.join(', ')}] vs [${p.equipo2.join(', ')}]`);
  }

  console.log('\nHistorial cargado correctamente.');
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
