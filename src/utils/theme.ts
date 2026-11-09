export type ThemeMode = 'dark' | 'light' | 'system';

const THEME_KEY = 'hs_theme_preference';

export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'dark'; // Default dark for luxury portfolio & battery saving
}

export function applyTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {}

  const root = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark);

  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // Dispatch custom event so React hooks can re-render
  window.dispatchEvent(new CustomEvent('hs-theme-changed', { detail: { mode, isDark } }));
}

export function initTheme(): void {
  const current = getStoredTheme();
  applyTheme(current);

  // Listen to system OS theme changes if on 'system'
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getStoredTheme() === 'system') {
        applyTheme('system');
      }
    });
  }
}

