import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center gap-2 py-10 text-sm text-muted justify-center">
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
      {label}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted">
      <Inbox className="size-6" aria-hidden />
      {children}
    </div>
  );
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      <AlertCircle className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
