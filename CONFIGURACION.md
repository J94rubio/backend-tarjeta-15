# 🚀 Guía de Despliegue - Backend Tarjeta 15 Años

## 📋 Descripción
Backend Node.js con Express para una aplicación de tarjeta de 15 años que maneja:
- 📸 Subida y gestión de fotos
- 🎉 Confirmaciones de asistencia
- 📊 Integración con Google Sheets
- 💾 Base de datos MongoDB Atlas

## 🌐 Opciones de Despliegue Gratuito

### Opción 1: Railway (Recomendado) 🚆
**Características:**
- ✅ 512MB RAM gratuitos
- ✅ $5 de crédito mensual
- ✅ Despliegue automático desde GitHub
- ✅ Base de datos PostgreSQL gratuita incluida

**Pasos para desplegar:**

1. **Preparar repositorio:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```

2. **Crear cuenta en Railway:**
   - Ve a [railway.app](https://railway.app)
   - Regístrate con GitHub
   - Conecta tu repositorio

3. **Configurar variables de entorno en Railway:**
   - `PORT`: Se configura automáticamente
   - `MONGODB_URI`: Tu string de conexión de MongoDB Atlas
   - `DB_NAME`: tarjeta15_anny

4. **Desplegar:**
   - Railway detectará automáticamente tu proyecto Node.js
   - El despliegue iniciará automáticamente

### Opción 2: Render 🎨
**Características:**
- ✅ 512MB RAM gratuitos
- ✅ Hibernación después de 15 min de inactividad
- ✅ Despliegue automático desde GitHub

**Pasos:**
1. Ve a [render.com](https://render.com)
2. Conecta tu repositorio de GitHub
3. Selecciona "Web Service"
4. Configura:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Agrega `MONGODB_URI` y `DB_NAME`

### Opción 3: Vercel (Para APIs) ⚡
**Nota:** Requiere adaptación para funciones serverless

### Opción 4: Heroku (Plan gratuito descontinuado)
**Estado:** Ya no ofrece plan gratuito

## 🔧 Configuración Previa

### 1. MongoDB Atlas (Base de datos gratuita)
- Crea una cuenta en [mongodb.com](https://www.mongodb.com/cloud/atlas)
- Crea un cluster gratuito (512MB)
- Configura el acceso desde cualquier IP (0.0.0.0/0)
- Obtén tu string de conexión

### 2. Google Sheets API (Opcional)
- Ve a [Google Cloud Console](https://console.cloud.google.com)
- Crea un proyecto o selecciona uno existente
- Habilita Google Sheets API
- Crea credenciales de Service Account
- Descarga el archivo JSON de credenciales

## 📁 Estructura de Archivos Añadidos

```
backend/
├── .env.example          # Plantilla de variables de entorno
├── .gitignore           # Archivos a ignorar en Git
├── Procfile             # Configuración para Railway/Heroku
├── railway.json         # Configuración específica de Railway
└── CONFIGURACION.md     # Esta documentación
```

## 🔐 Variables de Entorno Necesarias

```env
PORT=3001                    # Se configura automáticamente en producción
MONGODB_URI=mongodb+srv://...  # Tu string de conexión de MongoDB Atlas
DB_NAME=tarjeta15_anny      # Nombre de tu base de datos
```

## 🧪 Pruebas Locales

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Crear archivo .env** (copia de .env.example):
   ```bash
   copy .env.example .env
   ```

3. **Configurar variables en .env**

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

5. **Probar endpoints:**
   - `GET /api/test` - Prueba de conexión
   - `POST /api/fotos` - Subir fotos
   - `GET /api/fotos` - Listar fotos
   - `POST /api/confirmaciones` - Confirmar asistencia

## 🚀 URL de Producción

Una vez desplegado, tu backend estará disponible en:
- **Railway:** `https://tu-proyecto.railway.app`
- **Render:** `https://tu-proyecto.onrender.com`

## 📞 Endpoints de la API

### Fotos
- `POST /api/fotos` - Subir foto
- `GET /api/fotos` - Listar fotos
- `GET /api/fotos/:id` - Obtener foto específica
- `DELETE /api/fotos/:id` - Eliminar foto

### Confirmaciones
- `POST /api/confirmaciones` - Confirmar asistencia
- `GET /api/confirmaciones` - Listar confirmaciones

### Pruebas
- `GET /api/test` - Verificar estado del servidor

## 🛠️ Solución de Problemas

### Error de conexión a MongoDB
- Verifica que el string de conexión sea correcto
- Asegúrate de que tu IP esté en la whitelist de MongoDB Atlas
- Verifica las credenciales de usuario

### Error de puerto
- En producción, el puerto se asigna automáticamente
- No hardcodees el puerto 3001 en producción

### Problemas con Google Sheets
- Verifica que las credenciales JSON sean válidas
- Asegúrate de que el Service Account tenga permisos en la hoja

## 📈 Monitoreo

- **Railway:** Panel de control con logs en tiempo real
- **Render:** Dashboard con métricas de rendimiento
- Logs del servidor disponibles en la consola de cada plataforma

## 💡 Recomendaciones

1. **Usa Railway** para la mejor experiencia gratuita
2. **Mantén MongoDB Atlas** como base de datos (cluster gratuito)
3. **Configura alertas** para monitear el uso de recursos
4. **Optimiza las consultas** para reducir el uso de ancho de banda
5. **Implementa cache** si es necesario para mejorar rendimiento

## 🔗 Enlaces Útiles

- [Railway Documentation](https://docs.railway.app)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Node.js Deployment Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---
*Última actualización: Septiembre 2025*