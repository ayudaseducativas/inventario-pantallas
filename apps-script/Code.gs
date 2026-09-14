/**
 * API de inventario — Pantallas Interactivas (UAE)
 * ---------------------------------------------------
 * Este script convierte una hoja de Google Sheets en una mini API que el
 * dashboard consulta para leer y guardar pantallas.
 *
 * INSTALACIÓN (resumen — el detalle completo está en README.md):
 * 1. Crea un Google Sheet nuevo, llama a la primera hoja "Pantallas".
 * 2. Importa data/pantallas_seed.csv en esa hoja (Archivo > Importar).
 * 3. Extensiones > Apps Script, borra el contenido de Code.gs y pega este archivo.
 * 4. Implementar > Nueva implementación > Tipo: Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier usuario
 * 5. Copia la URL que te da y pégala en js/config.js
 */

const SHEET_NAME = 'Pantallas';

// Columnas en el mismo orden que las cabeceras de la hoja
const COLUMNS = [
  'id','bloque','salon','pulgadas','activo_fijo_pantalla','serial_pantalla','modelo',
  'accesorios','fecha_instalacion','fecha_iceberg','serial_ops','caracteristicas_ops',
  'fecha_ops','activo_fijo_ups','anio'
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('No existe una hoja llamada "' + SHEET_NAME + '"');
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET → devuelve todas las filas de la hoja como un arreglo de objetos JSON.
 * Ejemplo de uso desde el navegador: fetch(WEB_APP_URL)
 */
function doGet(e) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let v = row[i];
        // Normaliza fechas de Sheets (vienen como objeto Date) a texto ISO yyyy-mm-dd
        if (v instanceof Date) {
          v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
        obj[h] = (v === '' || v === null) ? null : v;
      });
      return obj;
    });
  return jsonResponse_(rows);
}

/**
 * POST → agrega una nueva fila (una pantalla nueva) al final de la hoja.
 * Espera un body JSON con las mismas llaves que COLUMNS (las que falten quedan vacías).
 * Nota: se envía como text/plain desde el navegador para evitar problemas de CORS
 * con Apps Script; aquí igual lo parseamos como JSON.
 */
function doPost(e) {
  try {
    const sheet = getSheet_();
    const data = JSON.parse(e.postData.contents);

    if (!data.salon || !data.bloque) {
      return jsonResponse_({ ok: false, error: 'Bloque y Salón son obligatorios' });
    }

    // Genera un id simple basado en la última fila
    const lastRow = sheet.getLastRow();
    const nextId = lastRow; // fila 1 = encabezados, así que lastRow ya sirve como id incremental

    const row = COLUMNS.map(col => {
      if (col === 'id') return nextId;
      return data[col] !== undefined && data[col] !== null ? data[col] : '';
    });

    sheet.appendRow(row);
    return jsonResponse_({ ok: true, id: nextId });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}
