// server.js - Archivo principal del servidor
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para CORS y parseo de body
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
// Si quieres exponer tus vistas HTML directamente:
app.use('/views', express.static(path.join(__dirname, 'views')));

// Conexión a MongoDB
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/seguimiento_profesores',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
.then(() => console.log('Conexión a MongoDB establecida'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

// Importar middleware de autenticación
const { authenticateToken } = require('./middleware/auth');

// Importar rutas
const authRoutes         = require('./routes/auth');
const asignaturasRoutes  = require('./routes/asignaturas');
const profesoresRoutes   = require('./routes/profesores');
const evaluacionesRoutes = require('./routes/evaluaciones');

// Montar rutas
app.use('/api/auth',        authRoutes);
app.use('/api/asignaturas',  authenticateToken, asignaturasRoutes);
app.use('/api/profesores',   authenticateToken, profesoresRoutes);
app.use('/api/evaluaciones', authenticateToken, evaluacionesRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de Seguimiento a Profesores',
    version: '1.0.0',
    endpoints: {
      auth:        '/api/auth',
      asignaturas: '/api/asignaturas',
      profesores:  '/api/profesores',
      evaluaciones:'/api/evaluaciones'
    }
  });
});

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
