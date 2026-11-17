import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

// Fonte única da verdade: a classe `dark` no <html>. Todos os botões de tema
// (navbar, menu do celular, login) leem e escrevem no mesmo lugar.
const listeners = new Set<() => void>();

const current = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Sem localStorage (modo privado): o tema só não fica salvo.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => 'light' as const);
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
