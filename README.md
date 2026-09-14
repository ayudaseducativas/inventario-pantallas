# Inventario de Pantallas Interactivas — UAE

Dashboard web para gestionar el inventario de pantallas interactivas de la
**Unidad de Ayudas Educativas y Centro de Cómputo (UAE)**: consulta, filtra,
visualiza estadísticas, revisa reportes/observaciones por pantalla y añade
nuevos registros directamente desde el navegador.

## Estructura del repositorio

```
.
├── index.html              # Punto de entrada del sitio (estructura HTML)
├── css/
│   └── styles.css          # Estilos (variables de color, layout, componentes)
├── js/
│   ├── config.js           # Aquí pegas la URL de tu Google Apps Script
│   └── app.js              # Lógica de la aplicación (filtros, gráficas, formulario)
├── data/
│   ├── pantallas.json      # Copia local de los datos (respaldo / modo sin Sheets)
│   └── pantallas_seed.csv  # Mismo inventario en CSV, para importar a Google Sheets
├── apps-script/
│   └── Code.gs             # Script que convierte tu Google Sheet en una API
└── excel/
    └── Inventario_Pantallas_Interactivas.xlsx   # Versión Excel con dashboard de fórmulas
```

## Tecnologías usadas

| Parte                     | Tecnología                                                          |
|----------------------------|----------------------------------------------------------------------|
| Estructura                 | HTML5                                                                |
| Estilos                    | CSS3 (variables custom, Flexbox, Grid) — sin frameworks              |
| Interactividad              | JavaScript vanilla (ES6+, `async/await`, `fetch`)                    |
| Gráficas                   | [Chart.js 4.4](https://www.chartjs.org/) vía CDN                     |
| Tipografía                 | Google Fonts — Plus Jakarta Sans                                     |
| Datos                      | JSON estático (`data/pantallas.json`) o Google Sheets (opcional, ver abajo) |
| Persistencia local          | `localStorage` del navegador (modo sin Sheets)                       |
| Backend ligero (opcional)  | Google Apps Script — expone un Google Sheet como API REST            |
| Excel                      | Python + `openpyxl` (fórmulas, formato condicional, gráficos)        |

No hay backend, base de datos ni build step: es un sitio 100% estático.

## Sección "Reportes pantallas"

El inventario ahora incluye dos columnas nuevas por pantalla:

- **`observaciones`** — texto libre (ej. "Pantalla presentó fallas, se envió a garantía").
- **`reporte_link`** — link a una carpeta de Google Drive con el soporte/historial de esa pantalla (fotos, actas, garantías, etc.).

Toda pantalla que tenga alguno de estos dos campos diligenciados aparece
automáticamente en el panel **"Reportes pantallas"** del dashboard, con un
botón que abre la carpeta de Drive en una pestaña nueva. Si ninguna pantalla
tiene estos campos llenos, el panel muestra un mensaje indicando cómo
cargarlos.

Puedes diligenciar estos campos de dos formas:
1. Desde el botón **"+ Añadir pantalla"** del propio dashboard (al crear un registro nuevo).
2. Editando directamente las columnas `observaciones` y `reporte_link` en tu Google Sheet, si ya conectaste el inventario a Sheets (ver sección siguiente) — no necesitas tocar el código, el dashboard las lee automáticamente.

**Importante sobre los links de Drive:** asegúrate de que cada carpeta tenga
el permiso "Cualquier persona con el enlace puede ver"; si no, el botón
llevará a las personas a una pantalla de "Solicitar acceso" en vez de mostrar
el contenido.

## Probarlo localmente

Como el sitio carga los datos con `fetch`, no puedes simplemente abrir
`index.html` haciendo doble clic. Necesitas un mini servidor local:

```bash
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` en tu navegador.

## Subir a GitHub

```bash
git init
git add .
git commit -m "Actualizacion del inventario"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/inventario-pantallas.git
git push -u origin main
```

Si el repositorio ya existe y solo estás actualizando, basta con:
```bash
git add .
git commit -m "Descripcion del cambio"
git push
```

## Activar GitHub Pages

1. **Settings → Pages** en tu repositorio.
2. Branch: **main**, carpeta **/ (root)** → **Save**.
3. Tu sitio queda en `https://tu-usuario.github.io/inventario-pantallas/` (o la URL de tu organización).

## Conectar el inventario a Google Sheets

### Paso 1 — Crea la hoja
1. Crea un Google Sheet nuevo, renombra la primera pestaña a **`Pantallas`**.
2. **Archivo → Importar → Subir**, sube `data/pantallas_seed.csv`, elige **"Reemplazar hoja actual"**.

### Paso 2 — Pega el script
1. **Extensiones → Apps Script**.
2. Borra el contenido de `Code.gs` y pega el de `apps-script/Code.gs` de este repositorio.
3. Guarda.

### Paso 3 — Publica como Aplicación web
1. **Implementar → Nueva implementación** → ícono de engranaje → **Aplicación web**.
2. Ejecutar como: **Yo** · Quién tiene acceso: **Cualquier usuario**.
3. Implementar, autoriza permisos, copia la URL que termina en `/exec`.

### Paso 4 — Conecta el dashboard
Pega la URL en `js/config.js`:
```js
const CONFIG = {
  SHEET_API_URL: "https://script.google.com/macros/s/AKfycb.../exec"
};
```
Guarda, haz commit y push. Para volver al modo local, simplemente deja
`SHEET_API_URL: ""` en `js/config.js`.
