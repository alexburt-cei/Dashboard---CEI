/**
 * Ámbitos: el segundo nivel de pestañas dentro de Formación y Sede.
 *
 * Seis pestañas — Madrid, Sevilla, Valencia, Online, Presencial y Total — que no
 * son una dimensión más, sino un **recorte** sobre el que se calcula la vista.
 * Se elige un ámbito y todo lo de debajo (tarjetas, gráficas, cumplimiento) se
 * calcula sólo con esas filas.
 *
 * ## De dónde sale «Online»
 *
 * Presencial está definido como Madrid + Valencia + Sevilla, así que las tres
 * sedes físicas son lo presencial y Online es lo demás. Pero «Online» puede
 * venir en el Excel de dos formas distintas, y las dos son razonables:
 *
 *   - como un valor más de la columna `Sede` (`Sede = "Online"`), o
 *   - en la columna opcional `Canal` (`Canal = "Online"`).
 *
 * El predicado acepta las dos. No es indecisión: es que el recorte tiene que
 * seguir funcionando tanto si el centro modela lo online como una sede más
 * —que es lo habitual cuando se factura por sede— como si lo separa en un
 * canal. Si se acertara sólo con una, la pestaña saldría vacía con la otra y
 * parecería un fallo de la aplicación en lugar de una diferencia de modelado.
 *
 * Por lo mismo, Presencial no se define como «no online» sino como
 * «pertenece a una de las tres sedes físicas»: así una sede nueva no se cuela
 * en presencial sin que nadie lo decida.
 */

// Extensión explícita: Vite resuelve sin ella, pero `node --test` no, y este
// módulo se testea con el runner nativo.
import { normalizeKey } from '../utils/excelParser.js';

/** Sedes físicas, en el orden en el que se muestran. */
export const SEDES_PRESENCIALES = ['madrid', 'sevilla', 'valencia'];

/** ¿La fila es online, esté modelada como sede o como canal? */
function esOnline(row) {
  return row.canal === 'online' || normalizeKey(row.sede ?? '') === 'online';
}

/**
 * ¿La fila es de esta sede física?
 *
 * Excluye lo online explícitamente, y esa exclusión es la que hace que las
 * cuentas cuadren. Si un Excel trae `Sede = Madrid` con `Canal = Online`, sin
 * excluir esa fila entraría a la vez en Madrid y en Online, y entonces
 * Presencial + Online superaría al Total: el panel enseñaría más dinero del que
 * hay. Con la exclusión, las tres sedes suman Presencial y Presencial + Online
 * suman el Total, que es la aritmética que se espera de estas pestañas.
 */
function esSede(row, sedeNormalizada) {
  return normalizeKey(row.sede ?? '') === sedeNormalizada && !esOnline(row);
}

/** ¿La fila es de una de las tres sedes físicas, y no online? */
function esPresencial(row) {
  return SEDES_PRESENCIALES.includes(normalizeKey(row.sede ?? '')) && !esOnline(row);
}

/**
 * @typedef {Object} Scope
 * @property {string}   slug   segmento de URL ('madrid')
 * @property {string}   labelKey clave de traducción
 * @property {(row: any) => boolean} match
 */

/** @type {Scope[]} */
export const SCOPES = [
  { slug: 'madrid', labelKey: 'scope.madrid', match: (row) => esSede(row, 'madrid') },
  { slug: 'sevilla', labelKey: 'scope.sevilla', match: (row) => esSede(row, 'sevilla') },
  { slug: 'valencia', labelKey: 'scope.valencia', match: (row) => esSede(row, 'valencia') },
  { slug: 'online', labelKey: 'scope.online', match: esOnline },
  { slug: 'presencial', labelKey: 'scope.presencial', match: esPresencial },
  // Total no filtra nada. Es la vista por defecto: se entra viendo el conjunto
  // y se baja al detalle, no al revés.
  { slug: 'total', labelKey: 'scope.total', match: () => true },
];

/** Ámbito al que se entra por omisión. */
export const DEFAULT_SCOPE_SLUG = 'total';

/** @returns {Scope|undefined} */
export function getScopeBySlug(slug) {
  return SCOPES.find((scope) => scope.slug === slug);
}

/**
 * Aplica el recorte de un ámbito.
 *
 * Un slug desconocido devuelve las filas sin tocar en vez de una lista vacía:
 * ante una URL manipulada es mejor enseñar el total que una pantalla en blanco
 * que parece un error.
 */
export function filterByScope(rows, slug) {
  const scope = getScopeBySlug(slug);
  if (!scope) return rows;
  return rows.filter(scope.match);
}

export default SCOPES;
