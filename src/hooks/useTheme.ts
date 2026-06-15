import { useEffect, useState } from 'react';

/** 暗色模式开关；持久化到 localStorage，并把 data-theme / data-accent 写到 <html>。 */
export function useTheme(): [boolean, () => void] {
  const [dark, setDark] = useState<boolean>(() => {
    const s = localStorage.getItem('cakeday.dark');
    if (s != null) return s === '1';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.setAttribute('data-accent', 'blue');
    localStorage.setItem('cakeday.dark', dark ? '1' : '0');
  }, [dark]);

  return [dark, () => setDark((d) => !d)];
}
