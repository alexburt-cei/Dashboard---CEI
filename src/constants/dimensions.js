/**
 * Fuente única de verdad de secciones y dimensiones.
 *
 * Todo lo que dependa de "qué secciones y pestañas existen" se deriva de aquí:
 * las rutas (routes/AppRoutes.jsx), SectionNav, TabNav y el campo por el que
 * agrupa cada pestaña. Añadir una pestaña nueva = añadir una entrada a
 * DIMENSIONS; no hay que tocar el router ni la navegación.
 */

/** @typedef {'real'|'objetivo'} TipoDato */

/**
 * @typedef {Object} Section
 * @property {string}   slug      segmento de URL ('reales')
 * @property {string}   path      ruta base ('/reales')
 * @property {string}   label     etiqueta visible
 * @property {TipoDato} tipoDato  valor de la columna "Tipo Dato" que filtra
 */

/** @type {Section[]} */
export const SECTIONS = [
  {
    slug: 'reales',
    path: '/reales',
    label: 'Datos Reales',
    tipoDato: 'real',
  },
  {
    slug: 'objetivos',
    path: '/objetivos',
    label: 'Objetivos',
    tipoDato: 'objetivo',
  },
];

/**
 * @typedef {Object} Dimension
 * @property {string} slug   segmento de URL ('formacion')
 * @property {string} label  etiqueta visible completa
 * @property {string} field  propiedad de DataRow por la que se agrupa
 * @property {string} column nombre de la columna en el Excel de origen
 */

/** @type {Dimension[]} */
export const DIMENSIONS = [
  {
    slug: 'formacion',
    label: 'Tipo de Formación',
    field: 'tipoFormacion',
    column: 'Tipo Formación',
  },
  {
    slug: 'sede',
    label: 'Sede',
    field: 'sede',
    column: 'Sede',
  },
];

/** Pestaña a la que se redirige cuando la URL sólo trae la sección. */
export const DEFAULT_DIMENSION_SLUG = DIMENSIONS[0].slug;

// Los ámbitos (Madrid, Sevilla, Valencia, Online, Presencial, Total) viven en
// constants/scopes.js: son un recorte de filas, no una dimensión de agrupación,
// y mezclarlos aquí habría hecho creer al router que son otra pestaña más.

/**
 * Resumen Global. Va aparte de `SECTIONS` porque no tiene pestañas de
 * dimensión: no se mira «por formación» o «por sede», mira el conjunto. Meterlo
 * en SECTIONS habría obligado a que el router le inventara una subruta
 * `:dimension` que no usa.
 */
export const RESUMEN = {
  slug: 'resumen',
  path: '/resumen',
  label: 'Resumen Global',
  hasDimensions: false,
};

/**
 * Navegación principal, en orden. Resumen Global va primero porque es la vista
 * de entrada: responde «cómo vamos» antes de bajar al detalle de «qué se ha
 * facturado», que es lo que hacen las otras dos.
 */
export const NAV_ITEMS = [
  RESUMEN,
  ...SECTIONS.map((section) => ({ ...section, hasDimensions: true })),
];

/** Ruta de entrada de la app. */
export const DEFAULT_ROUTE = RESUMEN.path;

/** @returns {Section|undefined} */
export function getSectionBySlug(slug) {
  return SECTIONS.find((section) => section.slug === slug);
}

/** @returns {Dimension|undefined} */
export function getDimensionBySlug(slug) {
  return DIMENSIONS.find((dimension) => dimension.slug === slug);
}
