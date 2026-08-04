# Dashboard CEI

Dashboard de ingresos por tipo de formación, área y sede, a partir de un Excel
subido por el usuario. React + Vite + React Router.

## Estado actual

1. **Estructura de carpetas y rutas** — las 6 vistas navegables.
2. **Parser de Excel** — con tests.
3. **Layout de navegación** — secciones + pestañas, carga de archivo, tarjetas resumen.
4. **Gráficas** — barras por categoría y evolución temporal, sin dependencias.

88 casos de test (`npm test`) sobre el parser, las agregaciones y las escalas.

### Las gráficas no usan librería

Están escritas a mano, sin Recharts ni equivalente. El reparto no es arbitrario:

- **Evolución temporal → SVG.** Una línea necesita geometría de trazado y una
  retícula de puntas para el crosshair, y sus etiquetas de eje son cortas
  ("ene 2026").
- **Barras por categoría → CSS.** Los nombres de categoría vienen del Excel del
  usuario y pueden ser larguísimos. SVG no tiene `text-overflow`, así que una
  etiqueta larga se saldría del trazado; con CSS el truncado con elipsis sale
  gratis. Las barras cumplen las mismas medidas igualmente.

Ambas llevan tooltip (con teclado además de ratón: flechas en la línea, tabulador
en las barras) y su tabla de datos plegable debajo, para que ningún valor
dependa del hover.

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests del parser y de las agregaciones
npm run build
```

Hay un archivo de ejemplo en `samples/ejemplo-ingresos.csv` para probar sin
tener que preparar un Excel.

> **Aviso:** `npm install` no se ha podido ejecutar en el entorno donde se
> escribió este código: la política de red del entorno bloquea
> `registry.npmjs.org` (`host_not_allowed`). El código fuente está completo y
> las versiones están fijadas en `package.json`, pero **las dependencias no se
> han instalado ni se ha ejecutado `vite build`**. Para desbloquear npm hay que
> añadir `registry.npmjs.org` al allowlist de egress del entorno, o instalar en
> local.
>
> Lo que sí está verificado sin dependencias: los 88 tests pasan con el runner
> nativo de Node; una comprobación estática confirma que todos los imports
> resuelven y que no hay clases CSS sin definir; y las gráficas se han
> renderizado en Chromium (con los módulos y el CSS reales) y revisado a la
> vista en claro y en oscuro. Ese repaso visual encontró tres fallos que los
> tests no ven y que están corregidos: la última etiqueta del eje X se cortaba
> contra el borde del SVG, la pista vacía de las barras de cumplimiento era azul
> con relleno naranja (se leía como un segundo dato en vez de como el hueco que
> falta), y en la gráfica de barras convivían dos notaciones de importe.

## Rutas

| Ruta | Vista |
|---|---|
| `/` | redirige a `/reales/formacion` |
| `/reales` | redirige a `/reales/formacion` |
| `/reales/formacion` | Datos Reales · por Tipo de Formación |
| `/reales/area` | Datos Reales · por Área |
| `/reales/sede` | Datos Reales · por Sede |
| `/objetivos` | redirige a `/objetivos/formacion` |
| `/objetivos/formacion` | Objetivos · por Tipo de Formación |
| `/objetivos/area` | Objetivos · por Área |
| `/objetivos/sede` | Objetivos · por Sede |
| cualquier otra | `NotFoundPage` |

Las secciones y las pestañas salen de un único registro,
`src/constants/dimensions.js`. Añadir una pestaña nueva es añadir una entrada a
`DIMENSIONS`: las rutas, la navegación y la agregación se enganchan solas.

Al cambiar de sección se conserva la pestaña activa: de `/reales/sede` se pasa a
`/objetivos/sede`, no de vuelta a la primera pestaña.

## Estructura

```
src/
├── components/
│   ├── FileUpload/index.jsx        arrastrar y soltar + selector
│   ├── layout/
│   │   ├── Header.jsx              identidad, estado del archivo, SectionNav
│   │   ├── SectionNav.jsx          Reales / Objetivos
│   │   └── TabNav.jsx              Formación / Área / Sede
│   ├── charts/
│   │   ├── ChartTable.jsx          vista de datos plegable de cada gráfica
│   │   ├── RevenueByCategory.jsx   barras por categoría (CSS)
│   │   └── RevenueTrendChart.jsx   evolución temporal (SVG + crosshair)
│   ├── DimensionDashboard.jsx      cuerpo de pestaña, sirve a las 6 vistas
│   ├── IssuesPanel.jsx             incidencias de la importación
│   ├── ProgressBar.jsx             cumplimiento real vs objetivo
│   └── SummaryCards.jsx            tarjetas resumen
├── constants/dimensions.js         registro de secciones y dimensiones
├── context/DataContext.jsx         dataset importado + persistencia
├── hooks/
│   ├── useElementWidth.js          ancho medido para el SVG (ResizeObserver)
│   └── useExcelParser.js           lectura del fichero con SheetJS
├── pages/
│   ├── RealesPage.jsx              TabNav + subrutas de Reales
│   ├── ObjetivosPage.jsx           TabNav + subrutas de Objetivos
│   └── NotFoundPage.jsx
├── routes/AppRoutes.jsx            todas las rutas
├── styles/
│   ├── tokens.css                  paleta y tokens (claro + oscuro)
│   └── global.css
└── utils/
    ├── excelParser.js              parseo puro + tests
    ├── dataTransform.js            agregaciones + tests
    ├── scale.js                    ejes, ticks y trazados + tests
    └── format.js                   formateo es-ES
```

Sobre lo propuesto se han añadido cinco archivos: `constants/dimensions.js`
(registro que evita repetir slugs en router y navegación), `utils/format.js`
(formateo, para no mezclarlo con las agregaciones), `components/DimensionDashboard.jsx`
(cuerpo de pestaña compartido por las 6 vistas, en vez de 6 páginas casi
idénticas), `components/IssuesPanel.jsx` y `pages/NotFoundPage.jsx`.

## El parser

`src/utils/excelParser.js` es **lógica pura sin dependencias**: recibe una
matriz de celdas y devuelve filas tipadas más incidencias. No sabe nada de
SheetJS ni de React, y por eso se puede testear con `node --test` sin bundler.
`src/hooks/useExcelParser.js` es la capa que lee el fichero con SheetJS y elige
la hoja.

### Columnas

Obligatorias: `Fecha`, `Tipo Formación`, `Área`, `Sede`, `Ingreso`, `Tipo Dato`.

Las cabeceras se comparan normalizadas (sin acentos, en minúsculas, separadores
colapsados), así que `Tipo Formación`, `TIPO_FORMACION` y `tipo de formacion`
valen igual. Cada campo acepta además sinónimos (`Importe`/`Facturación` para
`Ingreso`, `Centro`/`Campus` para `Sede`…) — la lista está en `COLUMN_ALIASES`.

### Qué acepta

| Campo | Formatos |
|---|---|
| `Fecha` | serial de Excel · `2026-01-31` · `2026-01` · `31/01/2026` · `31-01-2026` · `31/01/26` · `01/2026` · `ene-2026` · `enero 2026` · `31 de enero de 2026` |
| `Ingreso` | `1234.56` · `1.234,56` · `1.234,56 €` · `1,234.56` · `1 234,56` · `-1.234,56` · `(1.234,56)` |
| `Tipo Dato` | Real: `Real`, `Reales`, `Realizado`, `Ejecutado`, `Actual` · Objetivo: `Objetivo`, `Target`, `Meta`, `Presupuesto`, `Previsto` |

Decisiones que conviene conocer:

- **Las fechas se construyen y se leen siempre en UTC.** Se lee con
  `cellDates: false` y los seriales se convierten con aritmética UTC explícita.
  Si se mezclan getters locales y UTC, un ingreso del 1 de enero se cuenta en
  diciembre según la zona horaria del navegador.
- **`dd/mm/yyyy` se interpreta día primero** (convención española). Sólo se
  invierte a `mm/dd` cuando el primer número no puede ser un mes y el segundo sí.
- **Con sólo puntos, se distingue miles de decimal por grupos de tres:**
  `1.234` → 1234, pero `12.5` → 12.5.
- **Nunca lanza por datos malos.** Una celda inválida genera una incidencia con
  su número de fila de Excel y la fila se descarta; el resto se importa. Las
  incidencias se ven en la propia app (`IssuesPanel`).
- **Un `Tipo Dato` desconocido no se adivina**, se reporta.
- Busca la fila de cabeceras (tolera títulos y filas en blanco encima) y elige
  la hoja de datos aunque el libro empiece por una portada.

## Notas

- **`xlsx` 0.18.5** es la última versión publicada en el registro de npm.
  Tiene avisos de seguridad conocidos (prototype pollution, ReDoS) corregidos a
  partir de 0.19.3, que SheetJS sólo distribuye por su propio CDN. El riesgo
  aquí es bajo (cada usuario abre su propio archivo, no contenido de terceros),
  pero si se quiere la versión corregida:
  `npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`.
- El dataset importado se guarda en `localStorage` para que un refresco no
  obligue a volver a subir el archivo. Si no cabe, la sesión sigue en memoria.
- La paleta de `tokens.css` está validada para daltonismo y contraste en claro y
  oscuro. Si se cambian los colores de marca hay que re-validarla: lo que hace
  legible una gráfica es la separación entre colores adyacentes.
- Los ejes empiezan siempre en cero (`buildScale`). Recortar la base exagera las
  diferencias: es la forma más fácil de que una gráfica mienta sin que nadie lo
  note. Y los meses sin ingresos se rellenan a 0 en la serie temporal, porque
  saltárselos deforma la pendiente.
