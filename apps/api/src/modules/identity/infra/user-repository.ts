import { and, asc, eq, ilike, or } from 'drizzle-orm';
import type { Db } from '../../../db/client.ts';
import { users } from '../../../db/schema.ts';

export async function findUserByEmail(db: Db, email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function findUserById(db: Db, id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export function searchPatients(db: Db, search?: string) {
  // % e _ digitados pelo usuário são literais, não curingas.
  const pattern = search ? `%${search.replace(/[\\%_]/g, '\\$&')}%` : undefined;
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.role, 'PATIENT'),
        pattern ? or(ilike(users.name, pattern), ilike(users.email, pattern)) : undefined,
      ),
    )
    .orderBy(asc(users.name))
    .limit(50);
}
