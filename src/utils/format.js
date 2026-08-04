/**
 * Formateadores de presentación (es-ES).
 *
 * Los números grandes destacados (tarjetas, cifra principal) van con cifras
 * proporcionales; `tabular-nums` se reserva para columnas que deben alinearse
 * verticalmente (tablas y ticks de eje), vía CSS.
 */

const EUR_FULL = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const EUR_COMPACT = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const INTEGER = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

const PERCENT = new Intl.NumberFormat('es-ES', {
  style: 'percent',
  maximumFractionDigits: 1,
});

/** Importe completo: 1.234.567 € */
export function formatEUR(value) {
  if (!Number.isFinite(value)) return '—';
  return EUR_FULL.format(value);
}

/**
 * Importe compacto para tarjetas: por debajo de 10.000 se muestra completo
 * (más informativo que "9,8 mil"), por encima se abrevia.
 */
export function formatEURCompact(value) {
  if (!Number.isFinite(value)) return '—';
  return Math.abs(value) < 10000 ? EUR_FULL.format(value) : EUR_COMPACT.format(value);
}

export function formatInteger(value) {
  if (!Number.isFinite(value)) return '—';
  return INTEGER.format(value);
}

/** Ratio 0.87 -> "87 %". null cuando no hay base de cálculo. */
export function formatPercent(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return PERCENT.format(value);
}

const DECIMAL_1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

/**
 * Valor abreviado para ticks de eje: 50000 -> "50 k", 2500 -> "2,5 k".
 *
 * No usa el formato compacto de Intl con moneda porque en es-ES devuelve
 * "50 mil €", demasiado largo para un eje. El símbolo € sobra: lo dice el
 * título de la gráfica.
 */
export function formatAxisValue(value) {
  if (!Number.isFinite(value)) return '';

  const abs = Math.abs(value);
  if (abs >= 1000000) return `${DECIMAL_1.format(value / 1000000)} M`;
  if (abs >= 1000) return `${DECIMAL_1.format(value / 1000)} k`;
  return INTEGER.format(value);
}

/** Delta con signo explícito, para comparaciones vs objetivo. */
export function formatSignedEUR(value) {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${EUR_FULL.format(value)}`;
}
