// Servicio para integrar con Google Sheets
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1PmYO433SJmqkh1G6wAHj7rABrZD3m9J3bDQEK9468Ns'; // ID de tu hoja de cálculo

// Configuración de autenticación (usando Service Account)
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credentials.json'), // Archivo de credenciales de Google
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

// Función para agregar una confirmación a Google Sheets
async function addConfirmationToSheet(confirmationData) {
  try {
    const { nombre, telefono, asistencia, acompanantes } = confirmationData;
    
    // Preparar los datos para insertar
    const values = [
      [
        new Date().toLocaleString('es-ES'), // Fecha y hora
        nombre,
        telefono,
        asistencia,
        acompanantes || 'Ninguno',
        'Pendiente' // Estado inicial
      ]
    ];

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: 'Confirmaciones!A:F', // Rango donde insertar
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: values,
      },
    };

    const response = await sheets.spreadsheets.values.append(request);
    console.log('✅ Confirmación guardada en Google Sheets:', response.data);
    
    return {
      success: true,
      rowNumber: response.data.updates.updatedRows,
      data: confirmationData
    };
    
  } catch (error) {
    console.error('❌ Error guardando en Google Sheets:', error);
    throw error;
  }
}

// Función para crear las cabeceras si la hoja está vacía
async function initializeSheet() {
  try {
    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: 'Confirmaciones!A1:F1',
    };

    const response = await sheets.spreadsheets.values.get(request);
    
    // Si no hay datos, crear las cabeceras
    if (!response.data.values || response.data.values.length === 0) {
      const headers = [
        ['Fecha/Hora', 'Nombre', 'Teléfono', 'Asistencia', 'Acompañantes', 'Estado']
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Confirmaciones!A1:F1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: headers,
        },
      });

      console.log('✅ Cabeceras inicializadas en Google Sheets');
    }
  } catch (error) {
    console.error('❌ Error inicializando Google Sheets:', error);
  }
}

// Función para obtener todas las confirmaciones
async function getConfirmations() {
  try {
    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: 'Confirmaciones!A:F',
    };

    const response = await sheets.spreadsheets.values.get(request);
    return response.data.values || [];
  } catch (error) {
    console.error('❌ Error obteniendo confirmaciones:', error);
    throw error;
  }
}

export {
  addConfirmationToSheet,
  initializeSheet,
  getConfirmations
};
