import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useExcelParser } from '../hooks/useExcelParser';

const STORAGE_KEY = 'dashboard-cei:dataset:v1';

const DataContext = createContext(null);

const EMPTY_DATASET = {
  rows: [],
  issues: [],
  meta: null,
  fileName: null,
  importedAt: null,
};

/**
 * Las fechas no sobreviven a JSON, así que se serializan a ISO y se reviven al
 * leer. Si el revivido falla se descarta el guardado en lugar de arrastrar
 * filas con fechas inválidas.
 */
function serializeDataset(dataset) {
  return JSON.stringify({
    ...dataset,
    rows: dataset.rows.map((row) => ({ ...row, fecha: row.fecha.toISOString() })),
  });
}

function reviveDataset(raw) {
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.rows)) return null;

  const rows = parsed.rows.map((row) => {
    const fecha = new Date(row.fecha);
    if (Number.isNaN(fecha.getTime())) throw new Error('fecha inválida en el guardado');
    return { ...row, fecha };
  });

  return { ...EMPTY_DATASET, ...parsed, rows };
}

function readStoredDataset() {
  if (typeof window === 'undefined') return EMPTY_DATASET;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATASET;
    return reviveDataset(raw) ?? EMPTY_DATASET;
  } catch {
    // Guardado corrupto o de una versión anterior: se ignora y se limpia.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* modo privado sin acceso a localStorage */
    }
    return EMPTY_DATASET;
  }
}

/**
 * Estado global del dataset importado.
 *
 * Guarda TODAS las filas (reales y objetivos) sin filtrar: la sección
 * Objetivos necesita las reales para calcular el cumplimiento, así que el
 * filtrado por Tipo Dato se hace en la vista, no aquí.
 */
export function DataProvider({ children }) {
  const [dataset, setDataset] = useState(readStoredDataset);
  const { status, error, fileName, parseFile, reset } = useExcelParser();

  // Persistencia best-effort: un dataset grande puede pasarse de cuota y eso
  // no debe romper la sesión en curso.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (dataset.rows.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, serializeDataset(dataset));
      }
    } catch {
      /* sin espacio o sin permiso: los datos siguen vivos en memoria */
    }
  }, [dataset]);

  const loadFile = useCallback(
    async (file) => {
      const result = await parseFile(file);
      if (result?.ok) {
        setDataset({
          rows: result.rows,
          issues: result.issues,
          meta: result.meta,
          fileName: file.name,
          importedAt: new Date().toISOString(),
        });
      }
      return result;
    },
    [parseFile],
  );

  const clear = useCallback(() => {
    setDataset(EMPTY_DATASET);
    reset();
  }, [reset]);

  const value = useMemo(
    () => ({
      rows: dataset.rows,
      issues: dataset.issues,
      meta: dataset.meta,
      fileName: dataset.fileName ?? fileName,
      importedAt: dataset.importedAt,
      hasData: dataset.rows.length > 0,
      status,
      error,
      loadFile,
      clear,
    }),
    [dataset, fileName, status, error, loadFile, clear],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe usarse dentro de <DataProvider>.');
  }
  return context;
}

export default DataContext;
