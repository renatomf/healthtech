/** Código SQLSTATE e constraint de um erro do Postgres (o Drizzle embrulha o erro em `cause`). */
export function pgErrorOf(err: unknown): { code?: string; constraint?: string } {
  const pg = (err instanceof Error && err.cause ? err.cause : err) as {
    code?: string;
    constraint_name?: string;
  };
  return { code: pg?.code, constraint: pg?.constraint_name };
}
