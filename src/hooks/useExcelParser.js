import { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

import {
  FIELD_LABELS,
  REQUIRED_FIELDS,
  findHeaderRowIndex,
  mapColumns,
  parseSheetRows,
} from '../utils/excelParser';

/** Límite de tamaño; por encima de esto el navegador se atraganca sin avisar. */
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xlsm', '.xls', '.csv'];

/** @typedef {'idle'|'parsing'|'ready'|'error'} ParserStatus */

/**
 * Convierte una hoja en matriz de celdas.
 *
 * `cellDates: false` + `raw: true` es deliberado: las fechas llegan como
 * serial numérico de Excel y las convierte parseFecha con aritmética UTC
 * explícita. Si se deja que SheetJS construya los Date, el desplazamiento por
 * zona horaria puede mover un ingreso al mes anterior.
 */
function sheetToMatrix(sheet) {
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    blankrows: false,
    defval: null,
  });
}

/**
 * Elige la hoja de datos. No siempre es la primera: los libros reales traen
 * portadas, índices o pestañas de notas. Se busca la primera hoja cuyas
 * cabeceras estén completas y, si ninguna lo está, se cae a la primera hoja
 * para que el error que se muestre sea el de columnas que faltan.
 */
function pickDataSheet(workbook) {
  const candidates = workbook.SheetNames.map((name) => ({
    name,
    matrix: sheetToMatrix(workbook.Sheets[name]),
  }));

  const complete = candidates.find(({ matrix }) => {
    const headerIndex = findHeaderRowIndex(matrix);
    if (headerIndex === -1) return false;
    return mapColumns(matrix[headerIndex]).missing.length === 0;
  });

  return complete ?? candidates[0] ?? { name: null, matrix: [] };
}

function validateFile(file) {
  if (!file) return 'No se ha seleccionado ningún archivo.';

  const name = (file.name ?? '').toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return `Formato no soportado. Usa un archivo ${ACCEPTED_EXTENSIONS.join(', ')}.`;
  }

  if (file.size === 0) return 'El archivo está vacío.';

  if (file.size > MAX_FILE_BYTES) {
    const mb = Math.round(MAX_FILE_BYTES / (1024 * 1024));
    return `El archivo supera el límite de ${mb} MB.`;
  }

  return null;
}

/**
 * Lee un Excel/CSV y lo convierte en filas tipadas.
 *
 * El parseo pesado vive en utils/excelParser.js (puro); este hook sólo se
 * ocupa de leer el fichero, elegir la hoja y llevar el estado de la operación.
 *
 * @returns {{
 *   status: ParserStatus,
 *   error: string|null,
 *   result: import('../utils/excelParser').ParseResult|null,
 *   fileName: string|null,
 *   parseFile: (file: File) => Promise<import('../utils/excelParser').ParseResult|null>,
 *   reset: () => void,
 * }}
 */
export function useExcelParser() {
  const [status, setStatus] = useState(/** @type {ParserStatus} */ ('idle'));
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState(/** @type {string|null} */ (null));

  // Si el usuario sube dos ficheros seguidos, sólo el último puede escribir
  // el estado; sin esto una lectura lenta sobrescribe a una rápida posterior.
  const requestRef = useRef(0);

  const parseFile = useCallback(async (file) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    const validationError = validateFile(file);
    if (validationError) {
      setStatus('error');
      setError(validationError);
      setResult(null);
      setFileName(file?.name ?? null);
      return null;
    }

    setStatus('parsing');
    setError(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      if (requestRef.current !== requestId) return null;

      const workbook = XLSX.read(new Uint8Array(buffer), {
        type: 'array',
        cellDates: false,
        cellText: false,
      });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('El libro no contiene ninguna hoja.');
      }

      const { name, matrix } = pickDataSheet(workbook);
      const parseResult = parseSheetRows(matrix, { sheetName: name });

      if (requestRef.current !== requestId) return null;

      setResult(parseResult);

      if (parseResult.ok) {
        setStatus('ready');
        setError(null);
      } else {
        setStatus('error');
        const firstError = parseResult.issues.find((issue) => issue.severity === 'error');
        setError(
          firstError?.message ??
            'No se ha podido leer el archivo. Columnas esperadas: ' +
              `${REQUIRED_FIELDS.map((field) => FIELD_LABELS[field]).join(', ')}.`,
        );
      }

      return parseResult;
    } catch (caught) {
      if (requestRef.current !== requestId) return null;
      setStatus('error');
      setResult(null);
      setError(
        caught instanceof Error && caught.message
          ? `No se ha podido leer el archivo: ${caught.message}`
          : 'No se ha podido leer el archivo.',
      );
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    requestRef.current += 1;
    setStatus('idle');
    setError(null);
    setResult(null);
    setFileName(null);
  }, []);

  return { status, error, result, fileName, parseFile, reset };
}

export default useExcelParser;
