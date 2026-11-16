import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Banco limpo e seed relativo a hoje antes da suíte.
export default function globalSetup() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  execSync('pnpm db:reset', { cwd: root, stdio: 'inherit' });
}
