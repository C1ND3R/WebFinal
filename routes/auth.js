// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const { authenticateToken, checkRole } = require('../middleware/auth');

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Buscar el usuario en la base de datos
    const usuario = await Usuario.findOne({ username });
    
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({ message: 'Usuario desactivado. Contacte al administrador' });
    }
    
    // Verificar la contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    
    if (!passwordValida) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario._id,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      token,
      usuario: {
        id: usuario._id,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// POST /api/auth/register - Registrar nuevo usuario (solo Administrador)
router.post('/register', authenticateToken, checkRole(['Administrador']), async (req, res) => {
  try {
    const { username, password, email, nombre_completo, rol } = req.body;
    
    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ $or: [{ username }, { email }] });
    
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El nombre de usuario o email ya existe' });
    }
    
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      username,
      password: hashedPassword,
      email,
      nombre_completo,
      rol
    });
    
    const usuarioGuardado = await nuevoUsuario.save();
    
    // Eliminar la contraseña de la respuesta
    const usuarioResponse = {
      id: usuarioGuardado._id,
      username: usuarioGuardado.username,
      email: usuarioGuardado.email,
      nombre_completo: usuarioGuardado.nombre_completo,
      rol: usuarioGuardado.rol,
      activo: usuarioGuardado.activo,
      createdAt: usuarioGuardado.createdAt
    };
    
    res.status(201).json(usuarioResponse);
  } catch (error) {
    res.status(400).json({ message: 'Error al registrar usuario', error: error.message });
  }
});

// GET /api/auth/perfil - Obtener perfil del usuario autenticado
router.get('/perfil', authenticateToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select('-password');
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

// PUT /api/auth/cambiar-password - Cambiar contraseña
router.put('/cambiar-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // Obtener usuario actual
    const usuario = await Usuario.findById(req.user.id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña actual
    const passwordValida = await bcrypt.compare(oldPassword, usuario.password);
    
    if (!passwordValida) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }
    
    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Actualizar contraseña
    usuario.password = hashedPassword;
    usuario.updatedAt = Date.now();
    
    await usuario.save();
    
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(400).json({ message: 'Error al cambiar contraseña', error: error.message });
  }
});

module.exports = router;