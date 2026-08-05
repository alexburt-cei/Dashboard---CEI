import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { IDIOMAS, IDIOMA_POR_DEFECTO, getIdioma, traducir } from './idiomas';

const STORAGE_KEY = 'dashboard-cei:idioma:v1';

const I18nContext = createContext(null);

/** Idioma inicial: lo guardado, si no el del navegador, si no castellano. */
function idiomaInicial() {
  if (typeof window === 'undefined') return IDIOMA_POR_DEFECTO;
  try {
    const guardado = window.localStorage.getItem(STORAGE_KEY);
    if (guardado && IDIOMAS.some((idioma) => idioma.code === guardado)) return guardado;
  } catch {
    /* sin acceso a localStorage */
  }
  // El del navegador sólo como pista: 'en-US' cuenta como inglés.
  const preferido = (navigator?.language ?? '').slice(0, 2).toLowerCase();
  return IDIOMAS.some((idioma) => idioma.code === preferido) ? preferido : IDIOMA_POR_DEFECTO;
}

/**
 * Idioma de la interfaz.
 *
 * Expone `t` para los textos y `locale` para los formateadores. Las dos cosas
 * van juntas a propósito: traducir «Revenue» pero seguir escribiendo
 * «1.234,56 €» produce una cifra que un lector británico lee mil veces más
 * pequeña. Cambiar de idioma cambia el idioma **y** el formato de los números.
 */
export function I18nProvider({ children }) {
  const [code, setCode] = useState(idiomaInicial);

  const idioma = getIdioma(code);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Que `lang` sea correcto importa para lectores de pantalla y para el
      // guionado del navegador.
      document.documentElement.setAttribute('lang', code);
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* sin permiso: el idioma sigue aplicado en esta sesión */
    }
  }, [code]);

  const t = useCallback((clave, valores) => traducir(code, clave, valores), [code]);

  const value = useMemo(
    () => ({ code, idioma, locale: idioma.locale, idiomas: IDIOMAS, t, setIdioma: setCode }),
    [code, idioma, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n debe usarse dentro de <I18nProvider>.');
  return context;
}

export default I18nContext;
