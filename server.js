// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir ficheros estáticos:
//  - public/views → para los HTML bajo /<nombre>.html
//  - public       → para /js, /css, /images, etc.
app.use(express.static(path.join(__dirname, 'public', 'views')));
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true
})
.then(() => console.log('Conexión a MongoDB establecida'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

// Middleware de autenticación
const { authenticateToken } = require('./middleware/auth');

// Rutas API
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/usuarios',     authenticateToken, require('./routes/usuarios'));
app.use('/api/asignaturas',  authenticateToken, require('./routes/asignaturas'));
app.use('/api/profesores',   authenticateToken, require('./routes/profesores'));
app.use('/api/evaluaciones', authenticateToken, require('./routes/evaluaciones'));

// Rutas de Reportes
const reportesRouter = require('./routes/reportes');
app.use('/api/reportes', authenticateToken, reportesRouter);

// Captura cualquier /api/* no manejado
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Endpoint no encontrado' });
});

// Manejador de errores genérico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});



