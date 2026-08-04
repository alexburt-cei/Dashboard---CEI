/**
 * Escalas y ticks para las gráficas. Lógica pura y testeable.
 *
 * Los ticks se redondean a números legibles (0 / 10.000 / 20.000) en vez de
 * repartir el dominio en partes iguales: un eje que marca 13.427 no lo lee
 * nadie. Y el dominio incluye siempre el cero, porque una base recortada
 * exagera las diferencias entre barras.
 */

/**
 * Pasos legibles dentro de cada década, con el umbral por encima del cual se
 * pasa al siguiente. Los umbrales están en el punto medio y no en el propio
 * paso: así se redondea al valor más CERCANO, no siempre hacia arriba.
 *
 * Redondear siempre hacia arriba da menos ticks de los pedidos — con un máximo
 * de 51.000 y 5 ticks objetivo, un paso crudo de 10.200 subiría a 20.000 y
 * dejaría el eje en 4 marcas en vez de 6.
 */
const NICE_STEPS = [
  { limit: 1.5, step: 1 },
  { limit: 2.25, step: 2 },
  { limit: 3.5, step: 2.5 },
  { limit: 7.5, step: 5 },
];

/**
 * Redondea un paso al valor legible más cercano de su magnitud.
 *
 * @param {number} rawStep
 * @returns {number}
 */
export function niceStep(rawStep) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const match = NICE_STEPS.find((candidate) => normalized < candidate.limit);

  return (match?.step ?? 10) * magnitude;
}

/**
 * Construye una escala lineal con ticks redondos.
 *
 * El dominio siempre contiene el cero: para barras es obligatorio (si no, la
 * longitud deja de ser proporcional al valor) y para la línea de evolución
 * evita que una subida del 2% parezca vertical.
 *
 * @param {number} minValue  mínimo de los datos
 * @param {number} maxValue  máximo de los datos
 * @param {number} [targetTicks]
 * @returns {{min: number, max: number, step: number, ticks: number[], position: (value: number) => number}}
 */
export function buildScale(minValue, maxValue, targetTicks = 5) {
  const safeMin = Number.isFinite(minValue) ? minValue : 0;
  const safeMax = Number.isFinite(maxValue) ? maxValue : 0;

  const domainMin = Math.min(0, safeMin);
  const domainMax = Math.max(0, safeMax);
  const span = domainMax - domainMin;

  // Todo a cero: un eje 0–1 con dos ticks, en vez de dividir por cero.
  if (span === 0) {
    return {
      min: 0,
      max: 1,
      step: 1,
      ticks: [0, 1],
      position: () => 0,
    };
  }

  const step = niceStep(span / Math.max(1, targetTicks));

  // Se extiende el dominio a múltiplos del paso para que los extremos caigan
  // en un tick y las barras no se salgan del área de trazado.
  const min = Math.floor(domainMin / step) * step;
  const max = Math.ceil(domainMax / step) * step;

  const ticks = [];
  const count = Math.round((max - min) / step);
  for (let i = 0; i <= count; i += 1) {
    // i * step en vez de ir acumulando: evita el arrastre en coma flotante.
    ticks.push(min + i * step);
  }

  const range = max - min;

  return {
    min,
    max,
    step,
    ticks,
    /** Devuelve la posición del valor en el eje, de 0 a 1. */
    position: (value) => {
      if (!Number.isFinite(value)) return 0;
      return (value - min) / range;
    },
  };
}

/**
 * Elige cada cuántas etiquetas se pinta una, para que no se solapen.
 *
 * Es el mecanismo que evita el error de etiquetar todos los puntos: con 24
 * meses y sitio para 6 etiquetas, se pinta una de cada cuatro.
 *
 * @param {number} count      número de elementos
 * @param {number} maxLabels  cuántas etiquetas caben
 * @returns {number} cada cuántos elementos se etiqueta (>= 1)
 */
export function labelInterval(count, maxLabels) {
  if (!Number.isFinite(count) || count <= 0) return 1;
  if (!Number.isFinite(maxLabels) || maxLabels <= 0) return count;
  return Math.max(1, Math.ceil(count / maxLabels));
}

/**
 * Construye el atributo `d` de una polilínea.
 *
 * @param {Array<{x: number, y: number}>} points
 * @returns {string}
 */
export function linePath(points) {
  if (!points || points.length === 0) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

/**
 * Cierra la línea contra la base para el relleno de área.
 *
 * @param {Array<{x: number, y: number}>} points
 * @param {number} baselineY
 * @returns {string}
 */
export function areaPath(points, baselineY) {
  if (!points || points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath(points)} L${last.x.toFixed(2)} ${baselineY.toFixed(2)} L${first.x.toFixed(
    2,
  )} ${baselineY.toFixed(2)} Z`;
}

/**
 * Índice del punto más cercano a una posición horizontal. Es lo que permite
 * apuntar a un mes y no a una línea de 2px.
 *
 * @param {number[]} xs  posiciones de los puntos
 * @param {number} x     posición del puntero
 * @returns {number}
 */
export function nearestIndex(xs, x) {
  if (!xs || xs.length === 0) return -1;

  let best = 0;
  let bestDistance = Math.abs(xs[0] - x);
  for (let i = 1; i < xs.length; i += 1) {
    const distance = Math.abs(xs[i] - x);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}
