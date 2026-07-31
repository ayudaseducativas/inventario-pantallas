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

olver al modo local, simplemente deja `SHEET_API_URL: ""` en `js/config.js`.
