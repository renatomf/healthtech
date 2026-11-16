import { eq } from 'drizzle-orm';
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
