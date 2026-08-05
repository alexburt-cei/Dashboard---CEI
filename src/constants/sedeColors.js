/**
 * Color fijo por sede.
 *
 * A diferencia de la paleta categórica, que asigna por posición, aquí el color
 * pertenece a la sede: Madrid es roja en todas las gráficas, esté primera o
 * última, y siga o no en el filtro. Si el color siguiera al orden, al filtrar
 * una sede las demás cambiarían de color y el lector creería que cambió el dato.
 *
 * Los valores viven en tokens.css (`--sede-*`) para que cada tema —claro y
 * oscuro— use los suyos: en oscuro no son los mismos tonos aclarados, son los
 * que pasan la validación de contraste y daltonismo contra la superficie
 * oscura.
 */

import { normalizeKey } from '../utils/excelParser';

/** Sede normalizada -> variable CSS. */
const SEDE_TOKENS = {
  madrid: 'var(--sede-madrid)',
  valencia: 'var(--sede-valencia)',
  sevilla: 'var(--sede-sevilla)',
};

/**
 * Color de una sede, o `null` si no es una de las que tienen color propio.
 *
 * Devolver `null` y no un color por defecto es a propósito: quien llama decide
 * el fallback, y así una sede nueva en el Excel no se pinta calladamente con el
 * color de otra.
 *
 * @param {string} nombre valor de la columna Sede, tal cual viene del Excel
 * @returns {string|null}
 */
export function getSedeColor(nombre) {
  return SEDE_TOKENS[normalizeKey(nombre ?? '')] ?? null;
}

/** ¿Tiene esta dimensión colores propios por entidad? */
export function isSedeDimension(dimensionSlug) {
  return dimensionSlug === 'sede';
}

export default getSedeColor;
