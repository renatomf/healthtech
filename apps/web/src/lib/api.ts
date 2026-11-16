const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: init.method ?? 'GET',
    credentials: 'include',
    headers: init.body === undefined ? {} : { 'content-type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.code ?? 'UNKNOWN');
  return data as T;
}

export function queryString(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter((e): e is [string, string] => Boolean(e[1]));
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
}
