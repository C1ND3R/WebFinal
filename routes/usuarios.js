// routes/usuarios.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const Usuario = require('../models/usuario');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/usuarios
 * Listar todos los usuarios activos
 */
router.get(
  '/',
  authenticateToken,
  checkRole(['Administrador']),
  async (req, res) => {
    try {
      const usuarios = await Usuario.find({ activo: true }).select('-password');
      res.json(usuarios);
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
    }
  }
);

/**
 * GET /api/usuarios/:id
 * Obtener un usuario por ID
 */
router.get(
  '/:id',
  authenticateToken,
  checkRole(['Administrador']),
  async (req, res) => {
    try {
      const u = await Usuario.findById(req.params.id).select('-password');
      if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.json(u);
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener usuario', error: err.message });
    }
  }
);

/**
 * POST /api/usuarios
 * Crear usuario
 */
router.post(
  '/',
  authenticateToken,
  checkRole(['Administrador']),
  async (req, res) => {
    try {
      const { username, password, email, nombre_completo, rol } = req.body;
      if (!username || !password || !email || !rol) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
      }
      const exists = await Usuario.findOne({ $or: [{ username }, { email }] });
      if (exists) {
        return res.status(400).json({ message: 'Usuario o email ya existe' });
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const nuevo = new Usuario({
        username,
        email,
        nombre_completo,
        rol,
        password: hash,
        activo: true
      });
      const saved = await nuevo.save();
      const { _id, username: u, email: e, nombre_completo: n, rol: r, activo, createdAt } = saved;
      res.status(201).json({ id: _id, username: u, email: e, nombre_completo: n, rol: r, activo, createdAt });
    } catch (err) {
      res.status(400).json({ message: 'Error al crear usuario', error: err.message });
    }
  }
);

/**
 * PUT /api/usuarios/:id
 * Actualizar usuario
 */
router.put(
  '/:id',
  authenticateToken,
  checkRole(['Administrador']),
  async (req, res) => {
    try {
      const { username, email, nombre_completo, rol, password } = req.body;
      const updates = { username, email, nombre_completo, rol, updatedAt: Date.now() };
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(password, salt);
      }
      const updated = await Usuario.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
      if (!updated) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: 'Error al actualizar usuario', error: err.message });
    }
  }
);

/**
 * DELETE /api/usuarios/:id
 * Desactivar usuario (soft delete)
 */
router.delete(
  '/:id',
  authenticateToken,
  checkRole(['Administrador']),
  async (req, res) => {
    try {
      const u = await Usuario.findByIdAndUpdate(
        req.params.id,
        { activo: false, updatedAt: Date.now() },
        { new: true }
      );
      if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.json({ message: 'Usuario desactivado correctamente' });
    } catch (err) {
      res.status(500).json({ message: 'Error al eliminar usuario', error: err.message });
    }
  }
);

module.exports = router;

