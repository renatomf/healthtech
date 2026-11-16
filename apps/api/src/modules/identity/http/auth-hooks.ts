import type { Role } from '@healthtech/shared';
import type { FastifyRequest } from 'fastify';
import type { Db } from '../../../db/client.ts';
import { forbidden, unauthenticated } from '../../../shared/errors.ts';
import { findUserById } from '../infra/user-repository.ts';

export const AUTH_COOKIE = 'token';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: Role };
    user: AuthUser;
  }
}

// O perfil vem do banco, não do token: quem for removido ou rebaixado perde o acesso na hora.
export function authenticate(db: Db) {
  return async (request: FastifyRequest) => {
    let sub: string;
    try {
      ({ sub } = await request.jwtVerify<{ sub: string }>());
    } catch {
      throw unauthenticated();
    }
    const user = await findUserById(db, sub);
    if (!user) throw unauthenticated();
    request.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  };
}

export function requireRole(role: Role) {
  return async (request: FastifyRequest) => {
    if (request.user.role !== role) throw forbidden();
  };
}
