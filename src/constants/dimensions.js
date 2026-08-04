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
    slug: 'area',
    label: 'Área',
    field: 'area',
    column: 'Área',
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

/** Ruta de entrada de la app. */
export const DEFAULT_ROUTE = `${SECTIONS[0].path}/${DEFAULT_DIMENSION_SLUG}`;

/** @returns {Section|undefined} */
export function getSectionBySlug(slug) {
  return SECTIONS.find((section) => section.slug === slug);
}

/** @returns {Dimension|undefined} */
export function getDimensionBySlug(slug) {
  return DIMENSIONS.find((dimension) => dimension.slug === slug);
}
