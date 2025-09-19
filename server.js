// Backend API para manejar fotos con MongoDB
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { addConfirmationToSheet, initializeSheet } from './googleSheetsService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://josedev:*josedev94*@cluster0.fufuwku.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.DB_NAME || 'tarjeta15_anny';
const COLLECTION_PHOTOS = 'fotos_evento';

let client;
let db;

// Conectar a MongoDB
const connectToMongoDB = async () => {
  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      db = client.db(DB_NAME);
      console.log('✅ Conectado a MongoDB Atlas');
      
      // Inicializar Google Sheets
      try {
        await initializeSheet();
        console.log('✅ Google Sheets inicializado');
      } catch (sheetError) {
        console.warn('⚠️ Google Sheets no disponible:', sheetError.message);
      }
    }
    return db;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }
};

// Middlewares
app.use(cors());
app.use(express.json());

// Configurar multer para manejar archivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

// Convertir imagen a Base64 para guardar en MongoDB
const imageToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
};

// ========== RUTAS DE LA API ==========

// 📸 Subir una foto
app.post('/api/fotos/subir', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ninguna foto' });
    }

    const { userName, descripcion } = req.body;
    
    if (!userName || userName.trim() === '') {
      return res.status(400).json({ error: 'El nombre del usuario es requerido' });
    }

    // Conectar a MongoDB
    const database = await connectToMongoDB();
    const collection = database.collection(COLLECTION_PHOTOS);

    // Convertir imagen a Base64
    const base64Image = imageToBase64(req.file.buffer, req.file.mimetype);
    
    const photoData = {
      fileName: req.file.originalname,
      userName: userName.trim(),
      descripcion: descripcion || '',
      imageData: base64Image,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date(),
      timestamp: Date.now()
    };

    const result = await collection.insertOne(photoData);
    
    console.log('✅ Foto guardada en MongoDB:', result.insertedId);
    
    res.json({ 
      success: true, 
      message: 'Foto subida exitosamente',
      photoId: result.insertedId.toString()
    });

  } catch (error) {
    console.error('Error subiendo foto:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// 🖼️ Obtener todas las fotos
app.get('/api/fotos', async (req, res) => {
  try {
    const database = await connectToMongoDB();
    const collection = database.collection(COLLECTION_PHOTOS);
    
    const photos = await collection
      .find({})
      .sort({ timestamp: -1 }) // Más recientes primero
      .limit(50) // Máximo 50 fotos
      .toArray();
    
    // Convertir fotos para el frontend
    const photosForFrontend = photos.map(photo => ({
      id: photo._id.toString(),
      url: photo.imageData, // Base64 image data
      userName: photo.userName,
      descripcion: photo.descripcion,
      fileName: photo.fileName,
      uploadDate: photo.uploadDate.toLocaleString(),
      size: photo.size
    }));
    
    console.log(`✅ ${photos.length} fotos enviadas al frontend`);
    res.json(photosForFrontend);
    
  } catch (error) {
    console.error('Error obteniendo fotos:', error);
    res.status(500).json({ 
      error: 'Error obteniendo fotos',
      details: error.message 
    });
  }
});

// � Estadísticas de fotos
app.get('/api/fotos/stats', async (req, res) => {
  try {
    const database = await connectToMongoDB();
    const collection = database.collection(COLLECTION_PHOTOS);
    
    const photos = await collection.find({}).toArray();
    
    const stats = {
      totalPhotos: photos.length,
      totalUsers: [...new Set(photos.map(p => p.userName))].length,
      totalSize: photos.reduce((sum, p) => sum + (p.size || 0), 0),
      latestPhoto: photos.length > 0 ? photos[0].uploadDate : null
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas',
      details: error.message 
    });
  }
});

// ========== RUTA PARA CONFIRMACIONES ==========

// Enviar confirmación por WhatsApp con integraciones completas
app.post('/api/confirmacion', async (req, res) => {
  try {
    const { nombre, acompanantes, mensaje, telefono } = req.body;
    
    // Validar datos requeridos
    if (!nombre || !acompanantes || !telefono) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: nombre, acompañantes y teléfono' 
      });
    }

    let estadoAsistencia;
    if (mensaje && mensaje.includes('Sí, asistiré')) {
      estadoAsistencia = 'Confirmado - SÍ';
    } else if (mensaje && mensaje.includes('No podré asistir')) {
      estadoAsistencia = 'Confirmado - NO';
    } else {
      estadoAsistencia = 'Pendiente';
    }

    // Preparar datos de confirmación
    const confirmacion = {
      nombre,
      acompanantes: parseInt(acompanantes),
      mensaje: mensaje || '',
      telefono,
      asistencia: estadoAsistencia,
      fechaConfirmacion: new Date(),
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Guardar SOLO en Google Sheets
      await addConfirmationToSheet(confirmacion);
      console.log('✅ Confirmación guardada en Google Sheets');

      // 2. Log de confirmación para el organizador
      const asistencia = parseInt(acompanantes) > 0 ? 'SÍ' : 'NO';
      const numInvitados = parseInt(acompanantes);
      
      console.log('🎉 NUEVA CONFIRMACIÓN RECIBIDA:');
      console.log(`� Nombre: ${nombre}`);
      console.log(`� Teléfono: ${telefono}`);
      console.log(`✅ Asistencia: ${asistencia}`);
      console.log(`👥 Invitados: ${numInvitados}`);
      console.log(`� Mensaje: ${mensaje || 'Sin mensaje'}`);
      console.log('📊 Datos guardados en Google Sheets');

      // 3. Respuesta simple para el invitado (SIN enlaces WhatsApp)
      res.json({
        success: true,
        message: `¡Gracias ${nombre}! Tu confirmación ha sido registrada exitosamente.`
      });

    } catch (integrationError) {
      console.error('❌ Error en integración:', integrationError);
      res.status(500).json({ 
        error: 'Error procesando confirmación',
        details: integrationError.message 
      });
    }

  } catch (error) {
    console.error('Error procesando confirmación:', error);
    res.status(500).json({ 
      error: 'Error procesando confirmación',
      details: error.message 
    });
  }
});

// Obtener todas las confirmaciones
app.get('/api/confirmaciones', async (req, res) => {
  try {
    await connectToMongoDB();
    const collection = db.collection('confirmaciones');
    
    const confirmaciones = await collection
      .find({})
      .sort({ fechaConfirmacion: -1 })
      .toArray();

    const totalConfirmaciones = confirmaciones.length;
    const totalAcompanantes = confirmaciones.reduce((sum, conf) => sum + conf.acompanantes, 0);

    res.json({
      confirmaciones,
      estadisticas: {
        totalConfirmaciones,
        totalAcompanantes,
        totalPersonas: totalConfirmaciones + totalAcompanantes
      }
    });

  } catch (error) {
    console.error('Error obteniendo confirmaciones:', error);
    res.status(500).json({ 
      error: 'Error obteniendo confirmaciones',
      details: error.message 
    });
  }
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '🚀 Servidor backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend ejecutándose en puerto ${PORT}`);
  console.log(`📸 API de fotos disponible en /api/fotos`);
  console.log(`🧪 Prueba la conexión en /api/test`);
  console.log(`📊 Google Sheets: Configurado`);
  console.log(`📱 WhatsApp Business API: Configurado`);
  console.log(`💾 MongoDB: Atlas Cloud`);
});

export default app;
