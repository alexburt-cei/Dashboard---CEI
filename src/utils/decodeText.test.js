import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { decodeCsv, isTextFile } from './decodeText.js';

const CABECERA = 'Fecha,Tipo Formación,Área,Sede,Ingreso,Tipo Dato';

/** Bytes UTF-8 de una cadena. */
const utf8 = (text) => new TextEncoder().encode(text);

/** Bytes CP1252 de una cadena (sólo válido para caracteres < 0x100). */
function cp1252(text) {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i);
  return out;
}

describe('decodeCsv', () => {
  it('decodifica UTF-8 sin BOM conservando los acentos', () => {
    const { text, encoding } = decodeCsv(utf8(CABECERA));
    assert.equal(text, CABECERA);
    assert.equal(encoding, 'utf-8');
  });

  it('quita el BOM en lugar de pegarlo a la primera cabecera', () => {
    const conBom = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8(CABECERA)]);
    const { text } = decodeCsv(conBom);
    assert.equal(text, CABECERA);
    assert.ok(!text.startsWith('﻿'), 'el BOM no debe sobrevivir');
    assert.ok(text.startsWith('Fecha'), 'la primera cabecera debe quedar limpia');
  });

  it('cae a CP1252 cuando los bytes no son UTF-8 válido', () => {
    const { text, encoding } = decodeCsv(cp1252(CABECERA));
    assert.equal(text, CABECERA);
    assert.equal(encoding, 'windows-1252');
  });

  it('no convierte los acentos en mojibake (el fallo que corrige)', () => {
    const { text } = decodeCsv(utf8(CABECERA));
    assert.ok(text.includes('Área'), 'Área debe seguir siendo Área');
    assert.ok(text.includes('Tipo Formación'));
    assert.ok(!text.includes('Ãrea'), 'no debe aparecer el mojibake Ãrea');
    assert.ok(!text.includes('FormaciÃ³n'));
  });

  it('decodifica los valores acentuados de las filas, no sólo la cabecera', () => {
    const fila = '2026-01-15,Máster,Digital,Madrid,42000,Real';
    assert.equal(decodeCsv(utf8(fila)).text, fila);
    assert.ok(decodeCsv(utf8(fila)).text.includes('Máster'));
  });

  it('acepta ArrayBuffer además de Uint8Array', () => {
    const bytes = utf8(CABECERA);
    const { text } = decodeCsv(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    assert.equal(text, CABECERA);
  });

  it('con texto sin acentos ambas codificaciones coinciden', () => {
    const ascii = 'Fecha,Sede,Ingreso';
    assert.equal(decodeCsv(utf8(ascii)).text, ascii);
    assert.equal(decodeCsv(cp1252(ascii)).text, ascii);
  });

  it('no falla con un archivo vacío', () => {
    assert.equal(decodeCsv(new Uint8Array([])).text, '');
  });
});

describe('isTextFile', () => {
  it('reconoce las extensiones de texto, sin distinguir mayúsculas', () => {
    for (const name of ['datos.csv', 'DATOS.CSV', 'a.tsv', 'a.txt']) {
      assert.equal(isTextFile(name), true, name);
    }
  });

  it('deja fuera los formatos binarios, que SheetJS ya decodifica bien', () => {
    for (const name of ['libro.xlsx', 'libro.XLSM', 'viejo.xls']) {
      assert.equal(isTextFile(name), false, name);
    }
  });

  it('no lanza sin nombre de archivo', () => {
    assert.equal(isTextFile(null), false);
    assert.equal(isTextFile(undefined), false);
    assert.equal(isTextFile(''), false);
  });
});
