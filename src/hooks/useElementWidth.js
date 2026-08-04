import { useEffect, useRef, useState } from 'react';

/**
 * Mide el ancho real de un elemento y se actualiza al redimensionar.
 *
 * Las gráficas SVG necesitan el ancho en píxeles, no un viewBox escalado: con
 * `preserveAspectRatio` el texto de los ejes se estira o se encoge con el
 * contenedor y las zonas de pulsación dejan de coincidir con lo que se ve.
 *
 * @returns {[React.RefObject<HTMLElement>, number]} ref a observar y ancho en px
 */
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    // Sin ResizeObserver (entornos antiguos o de test) se mide una vez.
    if (typeof ResizeObserver === 'undefined') {
      setWidth(element.clientWidth);
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect?.width ?? element.clientWidth;
      setWidth(measured);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

export default useElementWidth;
