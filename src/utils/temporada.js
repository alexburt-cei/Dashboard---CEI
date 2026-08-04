/**
 * Temporadas de CEI = convocatorias.
 *
 * El calendario del centro no va por estaciones naturales ni por trimestres:
 * va por cuatro convocatorias al año, que abren en **enero, abril, junio y
 * octubre**. Todo lo comparativo del Resumen Global se apoya en esto — el gap
 * vs target, el run rate y la comparación con el año anterior sólo significan
 * algo si «lo mismo» del año pasado es la misma convocatoria, no el mismo mes.
 *
 * Cada convocatoria ocupa desde su mes de apertura hasta el mes anterior a la
 * siguiente, así que el año queda cubierto sin huecos ni solapes:
 *
 *   enero   → enero, febrero, marzo
 *   abril   → abril, mayo
 *   junio   → junio, julio, agosto, septiembre
 *   octubre → octubre, noviembre, diciembre
 *
 * Si el centro cambia sus convocatorias, se edita `CONVOCATORIAS` y se
 * recalcula todo: no hay meses escritos a mano en ningún otro sitio.
 *
 * Las fechas se leen SIEMPRE en UTC, como en el resto del proyecto: mezclar
 * getters locales y UTC mueve un ingreso de convocatoria según la zona horaria
 * del navegador.
 */

/**
 * @typedef {Object} Convocatoria
 * @property {string} id      identificador estable ('enero')
 * @property {string} label   etiqueta visible ('Convocatoria de enero')
 * @property {string} short   etiqueta corta para ejes ('Ene')
 * @property {number} mesInicio mes de apertura, 1-12
 */

/** @type {Convocatoria[]} — en orden cronológico dentro del año. */
export const CONVOCATORIAS = [
  { id: 'enero', label: 'Convocatoria de enero', short: 'Ene', mesInicio: 1 },
  { id: 'abril', label: 'Convocatoria de abril', short: 'Abr', mesInicio: 4 },
  { id: 'junio', label: 'Convocatoria de junio', short: 'Jun', mesInicio: 6 },
  { id: 'octubre', label: 'Convocatoria de octubre', short: 'Oct', mesInicio: 10 },
];

/** Meses (1-12) que cubre cada convocatoria, derivados de `mesInicio`. */
function mesesDe(indice) {
  const inicio = CONVOCATORIAS[indice].mesInicio;
  const siguiente = CONVOCATORIAS[indice + 1]?.mesInicio ?? 13;
  const meses = [];
  for (let mes = inicio; mes < siguiente; mes++) meses.push(mes);
  return meses;
}

/** Mapa mes (1-12) -> índice de convocatoria, calculado una sola vez. */
const MES_A_CONVOCATORIA = (() => {
  const mapa = new Array(13).fill(0);
  CONVOCATORIAS.forEach((_, indice) => {
    for (const mes of mesesDe(indice)) mapa[mes] = indice;
  });
  return mapa;
})();

/** Meses que cubre una convocatoria por id. */
export function mesesDeConvocatoria(id) {
  const indice = CONVOCATORIAS.findIndex((c) => c.id === id);
  return indice === -1 ? [] : mesesDe(indice);
}

/**
 * Convocatoria a la que pertenece una fecha.
 *
 * @param {Date} fecha
 * @returns {Convocatoria|null} null si la fecha no es válida
 */
export function convocatoriaDe(fecha) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return null;
  return CONVOCATORIAS[MES_A_CONVOCATORIA[fecha.getUTCMonth() + 1]];
}

/**
 * Clave de temporada: año + convocatoria, lo que identifica un periodo
 * comparable entre años. `2026-abril`.
 *
 * @param {Date} fecha
 * @returns {string|null}
 */
export function temporadaKey(fecha) {
  const convocatoria = convocatoriaDe(fecha);
  if (!convocatoria) return null;
  return `${fecha.getUTCFullYear()}-${convocatoria.id}`;
}

/** Descompone una clave de temporada. */
export function parseTemporadaKey(key) {
  const [anio, id] = String(key ?? '').split('-');
  const convocatoria = CONVOCATORIAS.find((c) => c.id === id);
  const year = Number(anio);
  if (!convocatoria || !Number.isInteger(year)) return null;
  return { anio: year, convocatoria };
}

/** Etiqueta visible de una temporada: 'Abr 2026'. */
export function temporadaLabel(key) {
  const parsed = parseTemporadaKey(key);
  return parsed ? `${parsed.convocatoria.short} ${parsed.anio}` : '—';
}

/**
 * La misma convocatoria del año anterior — la base de «cómo íbamos hace un
 * año a estas alturas». Comparar contra el mes natural anterior no serviría:
 * las convocatorias no tienen la misma duración.
 */
export function temporadaAnterior(key) {
  const parsed = parseTemporadaKey(key);
  return parsed ? `${parsed.anio - 1}-${parsed.convocatoria.id}` : null;
}

/** La convocatoria siguiente, cruzando el año cuando toca. */
export function temporadaSiguiente(key) {
  const parsed = parseTemporadaKey(key);
  if (!parsed) return null;
  const indice = CONVOCATORIAS.findIndex((c) => c.id === parsed.convocatoria.id);
  const siguiente = (indice + 1) % CONVOCATORIAS.length;
  const anio = siguiente === 0 ? parsed.anio + 1 : parsed.anio;
  return `${anio}-${CONVOCATORIAS[siguiente].id}`;
}

/** Primer día (UTC) de una temporada. */
export function inicioTemporada(key) {
  const parsed = parseTemporadaKey(key);
  if (!parsed) return null;
  return new Date(Date.UTC(parsed.anio, parsed.convocatoria.mesInicio - 1, 1));
}

/**
 * Día siguiente al último de la temporada, como límite superior exclusivo:
 * comparar con `<` evita el clásico error de perder el último día.
 */
export function finTemporada(key) {
  const siguiente = temporadaSiguiente(key);
  return siguiente ? inicioTemporada(siguiente) : null;
}

/**
 * Fracción de la temporada ya transcurrida en una fecha dada, de 0 a 1.
 *
 * Es lo que convierte un acumulado en run rate: si va el 40 % de la
 * convocatoria, el ritmo proyecta a total / 0,4. Fuera de la temporada
 * devuelve 0 o 1, nunca un valor extrapolado.
 *
 * @param {string} key clave de temporada
 * @param {Date} fecha momento de corte
 * @returns {number} 0..1
 */
export function fraccionTranscurrida(key, fecha) {
  const inicio = inicioTemporada(key);
  const fin = finTemporada(key);
  if (!inicio || !fin || !(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return 0;

  const total = fin.getTime() - inicio.getTime();
  const hecho = fecha.getTime() - inicio.getTime();
  if (hecho <= 0) return 0;
  if (hecho >= total) return 1;
  return hecho / total;
}

/** Temporadas entre dos claves, ambas incluidas, en orden cronológico. */
export function enumerateTemporadas(desde, hasta) {
  const inicio = parseTemporadaKey(desde);
  const fin = parseTemporadaKey(hasta);
  if (!inicio || !fin) return [];

  const salida = [];
  let actual = desde;
  // Cota dura: 4 convocatorias * 100 años. Sin ella, un rango invertido
  // giraría para siempre.
  for (let i = 0; i < 400 && actual; i++) {
    salida.push(actual);
    if (actual === hasta) return salida;
    actual = temporadaSiguiente(actual);
  }
  return salida.includes(hasta) ? salida : [];
}
