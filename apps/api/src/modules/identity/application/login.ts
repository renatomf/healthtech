import bcrypt from 'bcryptjs';
import type { Db } from '../../../db/client.ts';
import { AppError } from '../../../shared/errors.ts';
import { findUserByEmail } from '../infra/user-repository.ts';

// Compara com um hash qualquer quando o e-mail não existe, para o tempo de
// resposta não revelar quais e-mails estão cadastrados.
const DUMMY_HASH = '$2b$12$do5sivdcICUAuhKQX41Mwef75.eEmtI..TziYQPTRIP/mwwlg0p/G';

export async function login(db: Db, email: string, password: string) {
  const user = await findUserByEmail(db, email);
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas');
  }
  return user;
}
