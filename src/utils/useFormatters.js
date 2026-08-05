import { useMemo } from 'react';

import { useI18n } from '../i18n/I18nContext';
import { createFormatters } from './format';

/**
 * Formateadores atados al idioma elegido.
 *
 * Existe para que ningún componente importe los formateadores fijos en es-ES: si
 * lo hiciera, al pasar la interfaz a inglés los textos cambiarían y las cifras
 * no, que es la forma más silenciosa de que una tabla mienta.
 */
export function useFormatters() {
  const { locale } = useI18n();
  return useMemo(() => createFormatters(locale), [locale]);
}

export default useFormatters;
