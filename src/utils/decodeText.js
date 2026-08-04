/**
 * Decodificación de CSV a texto, separada de SheetJS a propósito.
 *
 * SheetJS, al recibir los bytes de un CSV como `Uint8Array`, los interpreta
 * como CP1252. Con un CSV en UTF-8 —lo que exporta hoy casi cualquier
 * herramienta— cada carácter acentuado se convierte en mojibake:
 *
 *     Área  ->  Ãrea        Tipo Formación  ->  Tipo FormaciÃ³n
 *
 * Y eso rompe la importación entera, no sólo la estética: la comparación de
 * cabeceras normaliza quitando acentos, pero `Ãrea` no es `Área` con un acento
 * de más, es otra secuencia de caracteres, así que la columna no se reconoce y
 * el archivo se rechaza por «faltan columnas obligatorias».
 *
 * La corrección es decodificar aquí, antes de que SheetJS vea los bytes, y
 * pasarle una cadena ya correcta.
 */

/** Codificación heredada de los CSV que exporta Excel en Windows. */
const LEGACY_ENCODING = 'windows-1252';

/**
 * Convierte los bytes de un CSV en texto, adivinando la codificación.
 *
 * Se intenta UTF-8 en modo estricto: `fatal: true` hace que el decodificador
 * lance si encuentra una secuencia que no es UTF-8 válido. Eso lo convierte en
 * un buen discriminador, porque un texto CP1252 con acentos casi nunca es UTF-8
 * válido — `Á` es 0xC1, que en UTF-8 anuncia un par de bytes y aquí no lo hay.
 * Si lanza, el archivo es heredado y se decodifica como CP1252.
 *
 * El BOM, si está, lo quita `TextDecoder` por su cuenta; conviene que no
 * sobreviva, porque pegado a la primera cabecera la dejaría sin reconocer.
 *
 * @param {ArrayBuffer|Uint8Array} buffer bytes del archivo
 * @returns {{text: string, encoding: 'utf-8'|'windows-1252'}}
 */
export function decodeCsv(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  try {
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      encoding: 'utf-8',
    };
  } catch {
    return {
      text: new TextDecoder(LEGACY_ENCODING).decode(bytes),
      encoding: LEGACY_ENCODING,
    };
  }
}

/** Extensiones que hay que decodificar a texto en lugar de leer como binario. */
const TEXT_EXTENSIONS = ['.csv', '.txt', '.tsv'];

/**
 * ¿Este archivo es texto plano y hay que decodificarlo antes de parsearlo?
 *
 * Los formatos binarios (.xlsx, .xlsm, .xls) no pasan por aquí: el .xlsx guarda
 * XML en UTF-8 dentro de un zip y SheetJS ya lo decodifica bien, así que tocarlo
 * sólo podría estropearlo.
 *
 * @param {string|null|undefined} fileName
 */
export function isTextFile(fileName) {
  const name = (fileName ?? '').toLowerCase();
  return TEXT_EXTENSIONS.some((extension) => name.endsWith(extension));
}
