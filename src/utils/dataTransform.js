/**
 * Agregaciones sobre las filas ya parseadas. Lógica pura y testeable.
 *
 * Todas las funciones reciben DataRow[] y devuelven estructuras listas para
 * pintar: tarjetas resumen, barras por categoría y series temporales.
 */

// Extensión explícita: así el módulo lo resuelven igual Vite y `node --test`.
import { SIN_ESPECIFICAR } from './excelParser.js';

const MONTH_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** Etiqueta con la que se agrupa la cola larga de categorías. */
export const OTROS_LABEL = 'Otros';

/**
 * Máximo de categorías con color propio. La paleta categórica tiene 8 ranuras
 * y no se generan tonos nuevos: a partir de ahí se agrupa en "Otros".
 */
export const MAX_CATEGORIAS_COLOREADAS = 8;

/**
 * @param {import('./excelParser').DataRow[]} rows
 * @param {import('./excelParser').TipoDato} tipoDato
 */
export function filterByTipoDato(rows, tipoDato) {
  return rows.filter((row) => row.tipoDato === tipoDato);
}

/** @param {import('./excelParser').DataRow[]} rows */
export function totalIngreso(rows) {
  return rows.reduce((sum, row) => sum + row.ingreso, 0);
}

/**
 * '2026-01' -> 'ene 2026'. Determinista, sin depender del locale del runtime.
 *
 * @param {string} periodo
 * @returns {string}
 */
export function periodoLabel(periodo, locale) {
  const match = /^(\d{4})-(\d{2})$/.exec(periodo ?? '');
  if (!match) return String(periodo ?? '');
  const monthIndex = Number(match[2]) - 1;

  // Con locale, el nombre del mes lo da Intl: así «ene 2026» pasa a «Jan 2026»
  // en inglés sin mantener una tabla de meses por idioma. Sin locale se usa la
  // tabla en castellano, que es lo que espera quien llama desde fuera de React.
  if (locale) {
    const fecha = new Date(Date.UTC(Number(match[1]), monthIndex, 1));
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(fecha);
  }

  const name = MONTH_SHORT[monthIndex];
  return name ? `${name} ${match[1]}` : match[1];
}

/**
 * Lista todos los periodos mensuales entre dos claves, ambas incluidas.
 * Sirve para que la evolución temporal no "salte" los meses sin ingresos:
 * un hueco en la serie miente sobre la tendencia.
 *
 * @param {string} from 'YYYY-MM'
 * @param {string} to   'YYYY-MM'
 * @returns {string[]}
 */
export function enumeratePeriodos(from, to) {
  const fromMatch = /^(\d{4})-(\d{2})$/.exec(from ?? '');
  const toMatch = /^(\d{4})-(\d{2})$/.exec(to ?? '');
  if (!fromMatch || !toMatch) return [];

  let year = Number(fromMatch[1]);
  let month = Number(fromMatch[2]);
  const endYear = Number(toMatch[1]);
  const endMonth = Number(toMatch[2]);

  const periodos = [];
  while (year < endYear || (year === endYear && month <= endMonth)) {
    periodos.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return periodos;
}

/**
 * Agrupa por una dimensión y suma ingresos, de mayor a menor.
 *
 * @param {import('./excelParser').DataRow[]} rows
 * @param {string} field  'tipoFormacion' | 'area' | 'sede'
 * @param {{limit?: number|null, otherLabel?: string}} [options]
 * @returns {Array<{key: string, total: number, count: number, share: number}>}
 */
export function groupByField(rows, field, options = {}) {
  const { limit = null, otherLabel = OTROS_LABEL } = options;

  const totals = new Map();
  rows.forEach((row) => {
    const key = row[field] ?? SIN_ESPECIFICAR;
    const current = totals.get(key) ?? { total: 0, count: 0 };
    current.total += row.ingreso;
    current.count += 1;
    totals.set(key, current);
  });

  const grandTotal = totalIngreso(rows);
  const withShare = (key, entry) => ({
    key,
    total: entry.total,
    count: entry.count,
    share: grandTotal === 0 ? 0 : entry.total / grandTotal,
  });

  let grouped = [...totals.entries()]
    .map(([key, entry]) => withShare(key, entry))
    // Desempate por nombre para que el orden sea estable entre renders.
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key, 'es'));

  if (limit !== null && grouped.length > limit) {
    const head = grouped.slice(0, limit);
    const tail = grouped.slice(limit);
    const tailEntry = tail.reduce(
      (acc, item) => ({ total: acc.total + item.total, count: acc.count + item.count }),
      { total: 0, count: 0 },
    );
    grouped = [...head, withShare(otherLabel, tailEntry)];
  }

  return grouped;
}

/**
 * Serie temporal mensual.
 *
 * @param {import('./excelParser').DataRow[]} rows
 * @param {{fillGaps?: boolean}} [options]
 * @returns {Array<{periodo: string, label: string, total: number, count: number}>}
 */
export function groupByPeriodo(rows, options = {}) {
  const { fillGaps = true } = options;

  const totals = new Map();
  rows.forEach((row) => {
    const current = totals.get(row.periodo) ?? { total: 0, count: 0 };
    current.total += row.ingreso;
    current.count += 1;
    totals.set(row.periodo, current);
  });

  const present = [...totals.keys()].sort();
  if (present.length === 0) return [];

  const periodos = fillGaps
    ? enumeratePeriodos(present[0], present[present.length - 1])
    : present;

  return periodos.map((periodo) => {
    const entry = totals.get(periodo) ?? { total: 0, count: 0 };
    return {
      periodo,
      label: periodoLabel(periodo),
      total: entry.total,
      count: entry.count,
    };
  });
}

/**
 * Compara real vs objetivo por categoría. Base de las barras de progreso de
 * la sección Objetivos.
 *
 * @param {import('./excelParser').DataRow[]} rows  filas SIN filtrar por tipoDato
 * @param {string} field
 * @returns {Array<{key: string, real: number, objetivo: number, cumplimiento: number|null, diff: number}>}
 */
export function buildComparison(rows, field) {
  const totals = new Map();

  rows.forEach((row) => {
    const key = row[field] ?? SIN_ESPECIFICAR;
    const current = totals.get(key) ?? { real: 0, objetivo: 0 };
    current[row.tipoDato] += row.ingreso;
    totals.set(key, current);
  });

  return [...totals.entries()]
    .map(([key, entry]) => ({
      key,
      real: entry.real,
      objetivo: entry.objetivo,
      // Sin objetivo no hay porcentaje que calcular: null, no 0 ni Infinity.
      cumplimiento: entry.objetivo === 0 ? null : entry.real / entry.objetivo,
      diff: entry.real - entry.objetivo,
    }))
    .sort((a, b) => b.objetivo - a.objetivo || a.key.localeCompare(b.key, 'es'));
}

/**
 * Cifras para las tarjetas resumen de una pestaña.
 *
 * @param {import('./excelParser').DataRow[]} rows  ya filtradas por sección
 * @param {string} field  dimensión de la pestaña
 */
export function summarize(rows, field) {
  const total = totalIngreso(rows);
  const categorias = new Set(rows.map((row) => row[field]));
  const periodos = groupByPeriodo(rows, { fillGaps: false });
  const top = groupByField(rows, field)[0] ?? null;

  return {
    total,
    registros: rows.length,
    categorias: categorias.size,
    periodos: periodos.length,
    mediaMensual: periodos.length === 0 ? 0 : total / periodos.length,
    periodoMin: periodos[0]?.periodo ?? null,
    periodoMax: periodos[periodos.length - 1]?.periodo ?? null,
    top,
  };
}

/**
 * Valores únicos de una dimensión, ordenados alfabéticamente. Para los filtros.
 *
 * @param {import('./excelParser').DataRow[]} rows
 * @param {string} field
 * @returns {string[]}
 */
export function getUniqueValues(rows, field) {
  return [...new Set(rows.map((row) => row[field]))].sort((a, b) => a.localeCompare(b, 'es'));
}
