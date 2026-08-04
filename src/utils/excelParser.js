/**
 * Parser del Excel de ingresos — lógica pura, sin dependencias.
 *
 * Este módulo no sabe nada de SheetJS ni de React: recibe una matriz de filas
 * (array de arrays, tal cual sale de una hoja) y devuelve filas tipadas más un
 * listado de incidencias. Está separado a propósito para poder testearlo con
 * `node --test` sin navegador ni bundler.
 *
 * Criterios de diseño:
 *  - Nunca lanza por datos malos. Una celda inválida produce una incidencia con
 *    su número de fila, y la fila se descarta. El usuario ve qué falló y dónde.
 *  - Las fechas se construyen y se leen SIEMPRE en UTC. Si se mezclan getters
 *    locales y UTC, un ingreso del 1 de enero se cuenta en diciembre según la
 *    zona horaria del navegador.
 *  - Los números aceptan formato español (1.234,56 €) y anglosajón (1,234.56).
 */

/** @typedef {'real'|'objetivo'} TipoDato */

/**
 * @typedef {Object} DataRow
 * @property {number}   id             nº de fila en la hoja (1-based), clave estable
 * @property {Date}     fecha          normalizada a medianoche UTC
 * @property {string}   periodo        'YYYY-MM', para las series temporales
 * @property {number}   anio
 * @property {string}   tipoFormacion
 * @property {string}   area
 * @property {string}   sede
 * @property {number}   ingreso
 * @property {TipoDato} tipoDato
 */

/**
 * @typedef {Object} Issue
 * @property {'error'|'warning'} severity
 * @property {number|null} row      nº de fila en la hoja (1-based), null si es global
 * @property {string|null} column
 * @property {unknown}     value
 * @property {string}      message
 */

/** Etiqueta para categorías vacías; mejor visible que una barra sin nombre. */
export const SIN_ESPECIFICAR = '(Sin especificar)';

/** Columnas obligatorias, en el orden en el que se informa al usuario. */
export const REQUIRED_FIELDS = [
  'fecha',
  'tipoFormacion',
  'area',
  'sede',
  'ingreso',
  'tipoDato',
];

/** Nombre legible de cada campo, para los mensajes de error. */
export const FIELD_LABELS = {
  fecha: 'Fecha',
  tipoFormacion: 'Tipo Formación',
  area: 'Área',
  sede: 'Sede',
  ingreso: 'Ingreso',
  tipoDato: 'Tipo Dato',
};

/**
 * Alias aceptados por columna, ya normalizados (sin acentos, minúsculas,
 * separadores colapsados a un espacio). Así "Tipo Formación", "TIPO_FORMACION"
 * y "tipo de formacion" caen todos en el mismo campo.
 */
export const COLUMN_ALIASES = {
  fecha: ['fecha', 'fechas', 'date', 'mes', 'periodo', 'fecha ingreso', 'fecha de ingreso'],
  tipoFormacion: [
    'tipo formacion',
    'tipo de formacion',
    'tipoformacion',
    'formacion',
    'tipo curso',
    'tipo de curso',
  ],
  area: ['area', 'areas', 'area formativa', 'departamento'],
  sede: ['sede', 'sedes', 'centro', 'campus', 'delegacion'],
  ingreso: [
    'ingreso',
    'ingresos',
    'importe',
    'facturacion',
    'revenue',
    'total',
    'euros',
    'importe total',
  ],
  tipoDato: ['tipo dato', 'tipo de dato', 'tipodato', 'tipo', 'dato', 'escenario'],
};

const REAL_VALUES = new Set([
  'real',
  'reales',
  'realidad',
  'realizado',
  'ejecutado',
  'actual',
  'actuals',
]);

const OBJETIVO_VALUES = new Set([
  'objetivo',
  'objetivos',
  'target',
  'targets',
  'meta',
  'metas',
  'presupuesto',
  'budget',
  'previsto',
  'prevision',
]);

const MONTH_NAMES = {
  ene: 0,
  enero: 0,
  jan: 0,
  january: 0,
  feb: 1,
  febrero: 1,
  february: 1,
  mar: 2,
  marzo: 2,
  march: 2,
  abr: 3,
  abril: 3,
  apr: 3,
  april: 3,
  may: 4,
  mayo: 4,
  jun: 5,
  junio: 5,
  june: 5,
  jul: 6,
  julio: 6,
  july: 6,
  ago: 7,
  agosto: 7,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  septiembre: 8,
  set: 8,
  september: 8,
  oct: 9,
  octubre: 9,
  october: 9,
  nov: 10,
  noviembre: 10,
  november: 10,
  dic: 11,
  diciembre: 11,
  dec: 11,
  december: 11,
};

/**
 * Normaliza un texto para comparar: quita acentos, pasa a minúsculas y
 * colapsa cualquier separador (espacios, guiones, guiones bajos, puntos) a un
 * único espacio.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeKey(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // marcas diacriticas combinantes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Empareja la fila de cabeceras con los campos del modelo.
 *
 * @param {unknown[]} headerRow
 * @returns {{indexes: Record<string, number>, missing: string[], duplicates: Array<{field: string, index: number, header: string}>, unknown: Array<{index: number, header: string}>}}
 */
export function mapColumns(headerRow) {
  /** @type {Record<string, number>} */
  const indexes = {};
  const duplicates = [];
  const unknownColumns = [];

  const cells = Array.isArray(headerRow) ? headerRow : [];

  cells.forEach((cell, index) => {
    const key = normalizeKey(cell);
    if (!key) return;

    const field = Object.keys(COLUMN_ALIASES).find((candidate) =>
      COLUMN_ALIASES[candidate].includes(key),
    );

    if (!field) {
      unknownColumns.push({ index, header: String(cell) });
      return;
    }

    // Primera columna que coincide gana; las siguientes se reportan pero no
    // sobrescriben, para que el resultado no dependa del orden de las hojas.
    if (indexes[field] === undefined) {
      indexes[field] = index;
    } else {
      duplicates.push({ field, index, header: String(cell) });
    }
  });

  const missing = REQUIRED_FIELDS.filter((field) => indexes[field] === undefined);

  return { indexes, missing, duplicates, unknown: unknownColumns };
}

/**
 * Localiza la fila de cabeceras. Los Excel reales suelen traer un título o
 * filas en blanco encima, así que se puntúa cada fila por número de columnas
 * reconocidas y se queda la mejor.
 *
 * @param {unknown[][]} matrix
 * @param {number} maxScanRows
 * @returns {number} índice 0-based, o -1 si ninguna fila parece cabecera
 */
export function findHeaderRowIndex(matrix, maxScanRows = 20) {
  if (!Array.isArray(matrix)) return -1;

  let bestIndex = -1;
  let bestScore = 0;

  const limit = Math.min(matrix.length, maxScanRows);
  for (let i = 0; i < limit; i += 1) {
    const { indexes } = mapColumns(matrix[i]);
    const score = Object.keys(indexes).length;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  // Con menos de 3 columnas reconocidas es más probable que sea una fila de
  // datos suelta que una cabecera de verdad.
  return bestScore >= 3 ? bestIndex : -1;
}

/** Epoch de los seriales de fecha de Excel, en UTC. */
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const EXCEL_MAX_SERIAL = 2958465; // 31-dic-9999
const MS_PER_DAY = 86400000;

/**
 * Convierte un serial de fecha de Excel a Date (medianoche UTC).
 *
 * Excel arrastra el bug del 1900 bisiesto: su serial 60 es el 29-feb-1900, que
 * no existe. Con epoch 1899-12-30 los seriales >= 61 salen correctos y los
 * anteriores necesitan un día más.
 *
 * @param {number} serial
 * @returns {Date|null}
 */
export function excelSerialToDate(serial) {
  if (typeof serial !== 'number' || !Number.isFinite(serial)) return null;
  if (serial < 1 || serial > EXCEL_MAX_SERIAL) return null;

  const days = Math.floor(serial); // la parte de hora no aporta nada aquí
  const offset = days < 60 ? 1 : 0;
  return new Date(EXCEL_EPOCH_UTC + (days + offset) * MS_PER_DAY);
}

/**
 * Construye una fecha UTC validando desbordes (31/02 no se convierte en 03/03).
 *
 * @returns {Date|null}
 */
function makeUTCDate(year, monthIndex, day) {
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) {
    return null;
  }
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, monthIndex, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Años de dos cifras: 00-69 -> 2000s, 70-99 -> 1900s. */
function expandYear(year) {
  if (year >= 100) return year;
  return year <= 69 ? 2000 + year : 1900 + year;
}

/**
 * Parsea una fecha desde un valor de celda: Date, serial de Excel o texto.
 *
 * Formatos de texto aceptados (se asume convención española: día primero):
 *   2026-01-31 · 2026-01-31T00:00:00Z · 2026-01
 *   31/01/2026 · 31-01-2026 · 31.01.2026 · 31/01/26
 *   01/2026
 *   ene-2026 · enero 2026 · ene 26
 *   31 de enero de 2026
 *
 * @param {unknown} value
 * @returns {Date|null}
 */
export function parseFecha(value) {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    // Se leen los componentes UTC: SheetJS construye sus Date en UTC y usar
    // getters locales desplazaría el día en zonas con offset negativo.
    return makeUTCDate(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }

  if (typeof value === 'number') {
    return excelSerialToDate(value);
  }

  if (typeof value !== 'string') return null;

  const raw = value.trim();
  if (!raw) return null;

  // ISO completo o año-mes
  const iso = raw.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?(?:[T\s].*)?$/);
  if (iso) {
    const year = Number(iso[1]);
    const monthIndex = Number(iso[2]) - 1;
    const day = iso[3] === undefined ? 1 : Number(iso[3]);
    return makeUTCDate(year, monthIndex, day);
  }

  // dd/mm/yyyy y variantes de separador
  const dmy = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    const first = Number(dmy[1]);
    const second = Number(dmy[2]);
    const year = expandYear(Number(dmy[3]));
    // Sólo se invierte a mm/dd cuando el primer número no puede ser un mes y
    // el segundo sí; en cualquier otro caso manda la convención española.
    const isUsOrder = first <= 12 && second > 12;
    const day = isUsOrder ? second : first;
    const monthIndex = (isUsOrder ? first : second) - 1;
    return makeUTCDate(year, monthIndex, day);
  }

  // mm/yyyy
  const my = raw.match(/^(\d{1,2})[/\-.](\d{4})$/);
  if (my) {
    return makeUTCDate(Number(my[2]), Number(my[1]) - 1, 1);
  }

  // "31 de enero de 2026" / "31 enero 2026"
  const dMonthY = raw.match(/^(\d{1,2})\s*(?:de\s+)?([a-zá-úñ]+)\.?\s*(?:de\s+)?(\d{2,4})$/i);
  if (dMonthY) {
    const monthIndex = MONTH_NAMES[normalizeKey(dMonthY[2])];
    if (monthIndex !== undefined) {
      return makeUTCDate(expandYear(Number(dMonthY[3])), monthIndex, Number(dMonthY[1]));
    }
  }

  // "ene-2026" / "enero 2026"
  const monthY = raw.match(/^([a-zá-úñ]+)\.?[\s\-/]*(?:de\s+)?(\d{2,4})$/i);
  if (monthY) {
    const monthIndex = MONTH_NAMES[normalizeKey(monthY[1])];
    if (monthIndex !== undefined) {
      return makeUTCDate(expandYear(Number(monthY[2])), monthIndex, 1);
    }
  }

  return null;
}

/**
 * Parsea un importe aceptando formato español y anglosajón.
 *
 * Reglas de desambiguación:
 *  - Si aparecen coma y punto, el separador situado más a la derecha es el
 *    decimal ("1.234,56" -> 1234.56 · "1,234.56" -> 1234.56).
 *  - Sólo comas: convención española, la coma es decimal ("1,50" -> 1.5).
 *    Varias comas son separador de miles ("1,234,567" -> 1234567).
 *  - Sólo puntos: si encajan en grupos exactos de tres son miles
 *    ("1.234" -> 1234, "1.234.567" -> 1234567); si no, decimal ("12.5" -> 12.5).
 *  - Negativos con signo delante, detrás o entre paréntesis.
 *
 * @param {unknown} value
 * @returns {number|null}
 */
export function parseIngreso(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') return null;

  let text = value.trim();
  if (!text) return null;

  let negative = false;

  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1).trim();
  }

  text = text
    .replace(/[€$£¥]/g, '')
    .replace(/\beur\b/gi, '')
    .replace(/[\s\u00a0\u202f\u2009]/g, '');

  if (text.startsWith('-')) {
    negative = !negative;
    text = text.slice(1);
  } else if (text.endsWith('-')) {
    negative = !negative;
    text = text.slice(0, -1);
  } else if (text.startsWith('+')) {
    text = text.slice(1);
  }

  // Sólo dígitos y separadores, y al menos un dígito.
  if (!/^[\d.,]*\d[\d.,]*$/.test(text)) return null;

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  const isThousandGroups = /^\d{1,3}(\.\d{3})+$/.test(text);

  let normalized;
  if (lastComma !== -1 && lastDot !== -1) {
    const decimalSep = lastComma > lastDot ? ',' : '.';
    const thousandSep = decimalSep === ',' ? '.' : ',';
    normalized = text.split(thousandSep).join('').replace(decimalSep, '.');
  } else if (lastComma !== -1) {
    normalized =
      text.split(',').length > 2 ? text.split(',').join('') : text.replace(',', '.');
  } else if (lastDot !== -1) {
    if (isThousandGroups) {
      normalized = text.split('.').join('');
    } else if (text.split('.').length > 2) {
      return null; // varios puntos que no forman grupos de tres: ilegible
    } else {
      normalized = text;
    }
  } else {
    normalized = text;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  return negative ? -parsed : parsed;
}

/**
 * Normaliza la columna "Tipo Dato". Devuelve null si el valor no se reconoce,
 * para que el llamante lo reporte en vez de adivinar.
 *
 * @param {unknown} value
 * @returns {TipoDato|null}
 */
export function parseTipoDato(value) {
  const key = normalizeKey(value);
  if (!key) return null;
  if (REAL_VALUES.has(key)) return 'real';
  if (OBJETIVO_VALUES.has(key)) return 'objetivo';
  return null;
}

/**
 * Normaliza el texto de una categoría conservando su capitalización original
 * (sólo colapsa espacios). Vacío -> SIN_ESPECIFICAR.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function parseCategoria(value) {
  if (value === null || value === undefined) return SIN_ESPECIFICAR;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text || SIN_ESPECIFICAR;
}

/**
 * Clave de periodo mensual en UTC.
 *
 * @param {Date} date
 * @returns {string} 'YYYY-MM'
 */
export function toPeriodo(date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}`;
}

function isEmptyRow(row) {
  if (!Array.isArray(row)) return true;
  return row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '');
}

/**
 * @typedef {Object} ParseResult
 * @property {boolean}   ok
 * @property {DataRow[]} rows
 * @property {Issue[]}   issues
 * @property {Object}    meta
 */

/**
 * Convierte una matriz de celdas en filas tipadas.
 *
 * @param {unknown[][]} matrix  array de arrays, incluida la fila de cabeceras
 * @param {{sheetName?: string|null, maxHeaderScanRows?: number}} [options]
 * @returns {ParseResult}
 */
export function parseSheetRows(matrix, options = {}) {
  const { sheetName = null, maxHeaderScanRows = 20 } = options;

  /** @type {Issue[]} */
  const issues = [];
  const emptyMeta = {
    sheetName,
    headerRowIndex: null,
    totalRows: 0,
    importedRows: 0,
    skippedRows: 0,
    columns: {},
    missingColumns: [],
    periodoMin: null,
    periodoMax: null,
    tipos: { real: 0, objetivo: 0 },
  };

  if (!Array.isArray(matrix) || matrix.length === 0) {
    issues.push({
      severity: 'error',
      row: null,
      column: null,
      value: null,
      message: 'La hoja está vacía.',
    });
    return { ok: false, rows: [], issues, meta: emptyMeta };
  }

  const headerRowIndex = findHeaderRowIndex(matrix, maxHeaderScanRows);
  if (headerRowIndex === -1) {
    issues.push({
      severity: 'error',
      row: null,
      column: null,
      value: null,
      message:
        'No se ha encontrado la fila de cabeceras. Se esperan las columnas: ' +
        `${REQUIRED_FIELDS.map((field) => FIELD_LABELS[field]).join(', ')}.`,
    });
    return { ok: false, rows: [], issues, meta: emptyMeta };
  }

  const { indexes, missing, duplicates, unknown } = mapColumns(matrix[headerRowIndex]);

  duplicates.forEach((duplicate) => {
    issues.push({
      severity: 'warning',
      row: headerRowIndex + 1,
      column: duplicate.header,
      value: duplicate.header,
      message:
        `La columna "${duplicate.header}" repite el campo ${FIELD_LABELS[duplicate.field]}; ` +
        'se usa la primera y se ignora esta.',
    });
  });

  unknown.forEach((column) => {
    issues.push({
      severity: 'warning',
      row: headerRowIndex + 1,
      column: column.header,
      value: column.header,
      message: `Columna "${column.header}" no reconocida; se ignora.`,
    });
  });

  if (missing.length > 0) {
    issues.push({
      severity: 'error',
      row: headerRowIndex + 1,
      column: null,
      value: null,
      message: `Faltan columnas obligatorias: ${missing
        .map((field) => FIELD_LABELS[field])
        .join(', ')}.`,
    });
    return {
      ok: false,
      rows: [],
      issues,
      meta: { ...emptyMeta, headerRowIndex, columns: indexes, missingColumns: missing },
    };
  }

  /** @type {DataRow[]} */
  const rows = [];
  let totalRows = 0;
  let skippedRows = 0;
  const tipos = { real: 0, objetivo: 0 };

  for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
    const cells = matrix[i];
    if (isEmptyRow(cells)) continue;

    totalRows += 1;
    const rowNumber = i + 1; // 1-based, como lo ve el usuario en Excel

    const fecha = parseFecha(cells[indexes.fecha]);
    const ingreso = parseIngreso(cells[indexes.ingreso]);
    const tipoDato = parseTipoDato(cells[indexes.tipoDato]);

    /** @type {Issue[]} */
    const rowIssues = [];

    if (!fecha) {
      rowIssues.push({
        severity: 'error',
        row: rowNumber,
        column: FIELD_LABELS.fecha,
        value: cells[indexes.fecha],
        message: 'Fecha vacía o no reconocida.',
      });
    }
    if (ingreso === null) {
      rowIssues.push({
        severity: 'error',
        row: rowNumber,
        column: FIELD_LABELS.ingreso,
        value: cells[indexes.ingreso],
        message: 'Ingreso vacío o no numérico.',
      });
    }
    if (!tipoDato) {
      rowIssues.push({
        severity: 'error',
        row: rowNumber,
        column: FIELD_LABELS.tipoDato,
        value: cells[indexes.tipoDato],
        message: 'Tipo Dato debe ser "Real" u "Objetivo".',
      });
    }

    if (rowIssues.length > 0) {
      issues.push(...rowIssues);
      skippedRows += 1;
      continue;
    }

    tipos[tipoDato] += 1;

    rows.push({
      id: rowNumber,
      fecha,
      periodo: toPeriodo(fecha),
      anio: fecha.getUTCFullYear(),
      tipoFormacion: parseCategoria(cells[indexes.tipoFormacion]),
      area: parseCategoria(cells[indexes.area]),
      sede: parseCategoria(cells[indexes.sede]),
      ingreso,
      tipoDato,
    });
  }

  if (rows.length === 0) {
    issues.push({
      severity: 'error',
      row: null,
      column: null,
      value: null,
      message: 'No se ha podido importar ninguna fila válida.',
    });
  }

  const periodos = rows.map((row) => row.periodo).sort();

  return {
    ok: rows.length > 0,
    rows,
    issues,
    meta: {
      sheetName,
      headerRowIndex,
      totalRows,
      importedRows: rows.length,
      skippedRows,
      columns: indexes,
      missingColumns: [],
      periodoMin: periodos[0] ?? null,
      periodoMax: periodos[periodos.length - 1] ?? null,
      tipos,
    },
  };
}
