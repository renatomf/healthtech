import type { Role } from '@healthtech/shared';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { Loading } from '../../components/ui/states.tsx';
import { homeOf, useMe } from './use-auth.ts';

// Só esconde telas: quem garante o acesso é a API.
export function RequireRole({ profile, children }: { profile: Role; children: ReactNode }) {
  const me = useMe();
  if (me.isPending) return <Loading />;
  if (!me.data) return <Navigate to="/login" replace />;
  if (me.data.role !== profile) return <Navigate to={homeOf(me.data.role)} replace />;
  return children;
}

export function HomeRedirect() {
  const me = useMe();
  if (me.isPending) return <Loading />;
  return <Navigate to={me.data ? homeOf(me.data.role) : '/login'} replace />;
}
