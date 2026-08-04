import { useCallback, useId, useRef, useState } from 'react';

import { useData } from '../../context/DataContext';

/**
 * Carga del Excel.
 *
 * `compact` sólo decide la forma, no el comportamiento: en la cabecera es un
 * botón suelto y en el estado vacío es la zona de arrastre completa. La zona
 * grande se pinta una sola vez, en el estado vacío, para no tener dos sitios
 * donde soltar el archivo en la misma pantalla.
 *
 * @param {{compact?: boolean}} props
 */
export default function FileUpload({ compact = false }) {
  const { loadFile, status, error, hasData } = useData();
  const inputRef = useRef(null);
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  const isParsing = status === 'parsing';

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      handleFiles(event.dataTransfer?.files);
    },
    [handleFiles],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const buttonLabel = (() => {
    if (isParsing) return 'Leyendo…';
    if (compact) return hasData ? 'Cambiar archivo' : 'Subir Excel';
    return 'Seleccionar archivo';
  })();

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      className="sr-only"
      accept=".xlsx,.xlsm,.xls,.csv"
      onChange={(event) => {
        handleFiles(event.target.files);
        // Permite volver a subir el mismo archivo tras corregirlo.
        event.target.value = '';
      }}
    />
  );

  const button = (
    <button type="button" className="button" onClick={openPicker} disabled={isParsing}>
      {buttonLabel}
    </button>
  );

  // El error se muestra en las dos formas: un fallo silencioso al elegir
  // archivo desde la cabecera dejaría al usuario sin saber qué ha pasado.
  const errorMessage = error ? (
    <p
      className={compact ? 'file-upload__error file-upload__error--compact' : 'file-upload__error'}
      role="alert"
    >
      {error}
    </p>
  ) : null;

  if (compact) {
    return (
      <div className="file-upload file-upload--compact">
        {input}
        {button}
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="file-upload">
      {input}
      <div
        className="file-upload__zone"
        data-dragging={isDragging || undefined}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <p className="file-upload__title">Arrastra aquí el Excel de ingresos</p>
        <p className="file-upload__hint">
          Columnas esperadas: Fecha, Tipo Formación, Área, Sede, Ingreso y Tipo Dato
          (Real u Objetivo).
        </p>
        {button}
      </div>
      {errorMessage}
    </div>
  );
}
