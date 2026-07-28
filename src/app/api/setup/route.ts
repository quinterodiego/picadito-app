import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { initSheets, migrateOrphanedDataToGroup } from '@/lib/sheets';

export async function POST() {
  try {
    await initSheets();

    // If there's an authenticated user with a group, migrate any orphaned rows to their group
    const session = await auth();
    if (session?.user?.groupId) {
      const migrated = await migrateOrphanedDataToGroup(session.user.groupId);
      return NextResponse.json({ ok: true, migrated });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al inicializar sheets' }, { status: 500 });
  }
}
