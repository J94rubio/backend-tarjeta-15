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

// Configuración de autenticación (usando variables de entorno para producción)
let auth;
let sheets;

function initializeGoogleAuth() {
  try {
    if (process.env.GOOGLE_SHEETS_PRIVATE_KEY && process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
      // Usar variables de entorno (producción)
      auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_SHEETS_PROJECT_ID || 'tarjeta-15-project',
          private_key_id: process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://accounts.google.com/o/oauth2/token',
        },
        scopes: SCOPES,
      });
    } else {
      // Usar archivo local (desarrollo)
      auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, 'credentials.json'),
        scopes: SCOPES,
      });
    }
    
    sheets = google.sheets({ version: 'v4', auth });
    return true;
  } catch (error) {
    console.warn('⚠️ No se pudo inicializar Google Sheets:', error.message);
    return false;
  }
}

// Función para agregar una confirmación a Google Sheets
async function addConfirmationToSheet(confirmationData) {
  try {
    // Inicializar Google Auth si no está inicializado
    if (!sheets && !initializeGoogleAuth()) {
      throw new Error('Google Sheets no configurado correctamente');
    }
    
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
    // Inicializar Google Auth si no está inicializado
    if (!sheets && !initializeGoogleAuth()) {
      throw new Error('Google Sheets no configurado correctamente');
    }
    
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
