import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'dashboard-cei:tema:v1';

const ThemeContext = createContext(null);

/** @typedef {'light'|'dark'} Tema */

/**
 * Tema de la aplicación.
 *
 * El claro es el predeterminado y **no** se sigue la preferencia del sistema: se
 * quitó el `prefers-color-scheme` a propósito, así que arrancar en claro es la
 * decisión, no un descuido. El oscuro existe pero hay que pedirlo.
 *
 * La elección se guarda en `localStorage` para que sobreviva a un refresco, y se
 * aplica marcando `data-theme` en la raíz, que es lo que leen los tokens.
 */
export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(/** @type {Tema} */ (() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const guardado = window.localStorage.getItem(STORAGE_KEY);
      return guardado === 'dark' ? 'dark' : 'light';
    } catch {
      // Modo privado sin acceso a localStorage: claro y a seguir.
      return 'light';
    }
  }));

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', tema);
    try {
      window.localStorage.setItem(STORAGE_KEY, tema);
    } catch {
      /* sin permiso: el tema sigue aplicado en esta sesión */
    }
  }, [tema]);

  const value = useMemo(
    () => ({
      tema,
      esOscuro: tema === 'dark',
      alternar: () => setTema((prev) => (prev === 'dark' ? 'light' : 'dark')),
      poner: setTema,
    }),
    [tema],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  return context;
}

export default ThemeContext;
