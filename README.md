# Inventario de Pantallas Interactivas — UAE

Dashboard web para gestionar el inventario de pantallas interactivas de la
**Unidad de Ayudas Educativas y Centro de Cómputo (UAE)**: consulta, filtra,
visualiza estadísticas y añade nuevos registros directamente desde el navegador.

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

| Parte              | Tecnología                                                        |
|---------------------|--------------------------------------------------------------------|
| Estructura           | HTML5                                                              |
| Estilos              | CSS3 (variables custom, Flexbox, Grid) — sin frameworks            |
| Interactividad       | JavaScript vanilla (ES6+, `async/await`, `fetch`)                  |
| Gráficas             | [Chart.js 4.4](https://www.chartjs.org/) vía CDN                   |
| Tipografía           | Google Fonts — Plus Jakarta Sans                                   |
| Datos                | JSON estático (`data/pantallas.json`) o Google Sheets (opcional, ver abajo) |
| Persistencia local   | `localStorage` del navegador (modo sin Sheets)                     |
| Backend ligero (opcional) | Google Apps Script — expone un Google Sheet como API REST      |
| Excel                | Python + `openpyxl` (fórmulas, formato condicional, gráficos)      |

No hay backend, base de datos ni build step: es un sitio 100% estático.

## Cómo verlo en tu computador

Como el sitio carga los datos con `fetch('data/pantallas.json')`, **no funciona
abriendo `index.html` con doble clic** (los navegadores bloquean `fetch` sobre
archivos locales `file://`). Debes servirlo con un servidor local:

```bash
# Con Python (ya viene instalado en la mayoría de sistemas)
cd pantallas-dashboard
python3 -m http.server 8000
# Abre http://localhost:8000 en tu navegador
```

o con la extensión **Live Server** de VS Code.

## Cómo subirlo a GitHub

```bash
cd pantallas-dashboard
git init
git add .
git commit -m "Dashboard de inventario de pantallas interactivas"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/NOMBRE-REPO.git
git push -u origin main
```

## Cómo publicarlo con GitHub Pages

1. Entra a tu repositorio en GitHub → pestaña **Settings**.
2. En el menú lateral, entra a **Pages**.
3. En **Source**, selecciona la rama `main` y la carpeta `/ (root)`.
4. Guarda. GitHub te dará una URL como:
   `https://TU-USUARIO.github.io/NOMBRE-REPO/`
5. Espera 1–2 minutos y visita ese link — el dashboard estará en línea.

Cada vez que quieras actualizar el inventario, reemplaza el contenido de
`data/pantallas.json`, haz `git add . && git commit -m "actualizar inventario" && git push`,
y GitHub Pages se actualiza solo.

## Notas importantes

- El archivo Excel (`excel/Inventario_Pantallas_Interactivas.xlsx`) es
  independiente del sitio web; se incluye en el repositorio solo como copia
  de respaldo/documentación, no se usa en tiempo de ejecución del dashboard.

## Conectar el inventario a Google Sheets (base de datos real y compartida)

Por defecto el dashboard funciona con el archivo local `data/pantallas.json`
y guarda las altas nuevas solo en el navegador de cada persona. Si quieres que
**todo el equipo vea y edite el mismo inventario en tiempo real**, puedes
conectarlo a una hoja de Google Sheets. No necesitas programar un servidor:
Google Apps Script actúa como la API intermedia.

### Paso 1 — Crea la hoja

1. Crea un Google Sheet nuevo.
2. Renombra la primera pestaña (abajo a la izquierda) a **`Pantallas`** (exacto, con esa mayúscula).
3. Ve a **Archivo → Importar → Subir** y sube `data/pantallas_seed.csv`.
   Elige la opción **"Reemplazar hoja actual"** para que las cabeceras queden en la fila 1.

### Paso 2 — Pega el script

1. En el Sheet, ve a **Extensiones → Apps Script**.
2. Borra todo el contenido de `Code.gs` que aparece por defecto.
3. Copia y pega el contenido completo de `apps-script/Code.gs` (de este repositorio).
4. Guarda el proyecto (ícono de disquete o `Ctrl+S`).

### Paso 3 — Publica el script como Aplicación web

1. Arriba a la derecha, botón **Implementar → Nueva implementación**.
2. En "Tipo", elige el ícono de engranaje → **Aplicación web**.
3. Configura:
   - **Ejecutar como:** Yo (tu cuenta)
   - **Quién tiene acceso:** Cualquier usuario
4. Clic en **Implementar**. Google te pedirá autorizar permisos la primera vez (es tu propio script, es seguro aceptar).
5. Copia la URL que termina en `/exec`.

### Paso 4 — Conecta el dashboard

1. Abre `js/config.js` en el repositorio.
2. Pega tu URL en `SHEET_API_URL`:
   ```js
   const CONFIG = {
     SHEET_API_URL: "https://script.google.com/macros/s/AKfycb.../exec"
   };
   ```
3. Guarda, haz commit y push. GitHub Pages se actualiza solo en 1-2 minutos.

Desde ese momento:
- El dashboard **lee** los datos directamente de tu Google Sheet cada vez que alguien lo abre.
- El botón **"+ Añadir pantalla"** agrega una fila nueva directamente en el Sheet — todo el equipo la verá al recargar la página, sin importar desde qué computador o navegador la agregó.
- Puedes seguir editando los datos manualmente desde el propio Google Sheet si lo prefieres; el dashboard siempre muestra la versión más reciente.

**Importante sobre permisos:** con "Quién tiene acceso: Cualquier usuario", cualquiera con el link de tu dashboard podría, en teoría, agregar filas a tu hoja (no puede editar ni borrar, solo agregar). Si tu dashboard es público, considera:
- No compartir la URL del dashboard fuera de tu institución, o
- Agregar una contraseña simple dentro del formulario (puedo ayudarte a agregar esa validación si la necesitas), o
- Cambiar el acceso del Sheet a "Cualquiera con el link de Google Workspace de tu institución" en vez de "Cualquier usuario" (paso 3), lo que limita el acceso a cuentas de tu propio dominio institucional.

Si en algún momento quieres desconectar Sheets y volver al modo local, simplemente deja `SHEET_API_URL: ""` en `js/config.js`.
