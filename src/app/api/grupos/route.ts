import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createGrupo, addMiembro, unirseConCodigo, migrateExistingDataToGroup } from '@/lib/sheets';

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();

  if (body.action === 'unirse') {
    const result = await unirseConCodigo(body.inviteCode, userId);
    if (!result) return NextResponse.json({ error: 'Código inválido' }, { status: 404 });
    return NextResponse.json({ groupId: result.groupId });
  }

  // Crear grupo
  const { id: groupId, inviteCode } = await createGrupo({ nombre: body.nombre || 'Mi Grupo', adminId: userId });
  await addMiembro(groupId, userId, 'admin');
  // Claim any pre-existing rows that have no group_id (first-user migration)
  await migrateExistingDataToGroup(groupId);
  return NextResponse.json({ groupId, inviteCode }, { status: 201 });
}
