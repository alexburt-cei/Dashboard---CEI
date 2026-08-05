/**
 * Formateadores de presentación (es-ES).
 *
 * Los números grandes destacados (tarjetas, cifra principal) van con cifras
 * proporcionales; `tabular-nums` se reserva para columnas que deben alinearse
 * verticalmente (tablas y ticks de eje), vía CSS.
 */

/**
/**
 * Los formateadores dependen del idioma, no sólo los textos.
 *
 * En castellano los miles van con punto y el decimal con coma; en inglés al
 * revés. Traducir «Revenue» y dejar «1.234,56 €» produce una cifra que un lector
 * británico lee como mil doscientos: el formato es parte de la traducción.
 *
 * Se construyen por locale y se memorizan, porque crear un `Intl.NumberFormat`
 * no es gratis y estas funciones se llaman una vez por celda de tabla.
 */
const CACHE = new Map();

export function createFormatters(locale = 'es-ES') {
  const cacheado = CACHE.get(locale);
  if (cacheado) return cacheado;

  const EUR_FULL = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    // `useGrouping: 'always'` no es cosmético: por omisión ICU no agrupa los
    // enteros de cuatro cifras en es-ES, así que 9500 salía «9500 €» junto a
    // «12.000 €». En una columna de importes se leen como dos notaciones para lo
    // mismo, y el ojo compara longitudes de cadena antes que valores.
    useGrouping: 'always',
  });

  const EUR_COMPACT = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  const INTEGER = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    useGrouping: 'always',
  });

  const PERCENT = new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  });

  const DECIMAL_1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  const api = {
    locale,

    formatEUR(value) {
      if (!Number.isFinite(value)) return '—';
      return EUR_FULL.format(value);
    },

    formatEURCompact(value) {
      if (!Number.isFinite(value)) return '—';
      return Math.abs(value) < 10000 ? EUR_FULL.format(value) : EUR_COMPACT.format(value);
    },

    formatInteger(value) {
      if (!Number.isFinite(value)) return '—';
      return INTEGER.format(value);
    },

    formatPercent(value) {
      if (value === null || value === undefined || !Number.isFinite(value)) return '—';
      return PERCENT.format(value);
    },

    formatAxisValue(value) {
      if (!Number.isFinite(value)) return '';
      const abs = Math.abs(value);
      if (abs >= 1000000) return `${DECIMAL_1.format(value / 1000000)} M`;
      if (abs >= 1000) return `${DECIMAL_1.format(value / 1000)} k`;
      return INTEGER.format(value);
    },

    formatSignedEUR(value) {
      if (!Number.isFinite(value)) return '—';
      const sign = value > 0 ? '+' : '';
      return `${sign}${EUR_FULL.format(value)}`;
    },
  };

  CACHE.set(locale, api);
  return api;
}

/**
 * Formateadores por omisión (es-ES). Se mantienen como exportaciones sueltas
 * para lo que no vive dentro de React —y para los tests—; los componentes usan
 * `useFormatters()`, que sigue al idioma elegido.
 */
const DEFAULTS = createFormatters('es-ES');

/**
 * Exportaciones sueltas en es-ES, que delegan en los formateadores por omisión.
 * Las mantiene todo lo que no vive dentro de React, y los tests.
 */
export const formatEUR = (value) => DEFAULTS.formatEUR(value);
export const formatEURCompact = (value) => DEFAULTS.formatEURCompact(value);
export const formatInteger = (value) => DEFAULTS.formatInteger(value);
export const formatPercent = (value) => DEFAULTS.formatPercent(value);
export const formatAxisValue = (value) => DEFAULTS.formatAxisValue(value);
export const formatSignedEUR = (value) => DEFAULTS.formatSignedEUR(value);
