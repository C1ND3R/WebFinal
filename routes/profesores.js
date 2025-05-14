// routes/profesores.js
const express = require('express');
const router = express.Router();

const Profesor              = require('../models/profesor');
const TrayectoriaAsignatura = require('../models/trayectoriaAsignatura');
const Asignatura            = require('../models/asignaturas');

const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * POST /api/profesores
 * Crear un nuevo profesor (Administrador)
 */
router.post(
  '/',
  authenticateToken,
  checkRole(['Administrador']),
  async (req, res) => {
    try {
      const { usuario, telefono, departamento, oficina } = req.body;
      const nuevo = new Profesor({ usuario, telefono, departamento, oficina });
      const guardado = await nuevo.save();
      res.status(201).json(guardado);
    } catch (error) {
      res.status(400).json({ message: 'Error al crear profesor', error: error.message });
    }
  }
);

/**
 * GET /api/profesores
 * Listar todos los profesores activos (Administrador, Coordinador)
 */
router.get(
  '/',
  authenticateToken,
  checkRole(['Administrador', 'Coordinador']),
  async (req, res) => {
    try {
      const lista = await Profesor.find({ activo: true })
        .populate('usuario', 'nombre_completo email')
        .sort({ 'usuario.nombre_completo': 1 });
      const listaFiltrada = lista.filter(p => p.usuario != null);
      res.status(200).json(listaFiltrada);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener profesores', error: error.message });
    }
  }
);

/**
 * GET /api/profesores/:id
 * Obtener datos de un profesor específico (Administrador, Coordinador)
 */
router.get(
  '/:id',
  authenticateToken,
  checkRole(['Administrador', 'Coordinador']),
  async (req, res) => {
    try {
      const prof = await Profesor.findById(req.params.id)
        .populate('usuario', 'nombre_completo email');
      if (!prof) {
        return res.status(404).json({ message: 'Profesor no encontrado' });
      }
      res.status(200).json(prof);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el profesor', error: error.message });
    }
  }
);

/**
 * GET /api/profesores/:id/asignaturas
 * Devuelve la lista de trayectorias (asignaturas) para el profesor :id
 */
router.get(
  '/:id/asignaturas',
  authenticateToken,
  checkRole(['Coordinador', 'Administrador']),
  async (req, res) => {
    try {
      const trayectorias = await TrayectoriaAsignatura.find({ profesor: req.params.id })
        .populate('asignatura', 'nombre periodo anio grupo')
        .sort({ anio: -1, periodo: 1, grupo: 1 });
      return res.json(trayectorias);
    } catch (err) {
      console.error('Error en GET /api/profesores/:id/asignaturas:', err);
      return res
        .status(500)
        .json({ message: 'Error al cargar asignaturas del profesor', error: err.message });
    }
  }
);

/**
 * POST /api/profesores/:id/asignaturas
 * Asignar una asignatura a un profesor (Administrador)
 */
router.post(
  '/:id/asignaturas',
  authenticateToken,
  checkRole(['Administrador']),
  async (req, res) => {
    try {
      const profesorId = req.params.id;
      const { asignatura, periodo, anio, grupo } = req.body;
      if (!asignatura || !periodo || !anio || !grupo) {
        return res.status(400).json({ message: 'Datos incompletos para asignar asignatura' });
      }
      const nuevaAsignacion = new TrayectoriaAsignatura({
        profesor: profesorId,
        asignatura,
        periodo,
        anio,
        grupo
      });
      const guardada = await nuevaAsignacion.save();
      res.status(201).json(guardada);
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(409)
          .json({ message: 'La asignatura ya está asignada a este profesor' });
      }
      console.error('Error asignando asignatura:', err);
      res.status(500).json({ message: 'Error al asignar asignatura', error: err.message });
    }
  }
);

/**
 * PUT /api/profesores/:id
 * Actualizar datos de un profesor (Administrador)
 */
router.put(
  '/:id',
  authenticateToken,
  checkRole(['Administrador']),
  async (req, res) => {
    try {
      const { telefono, departamento, oficina, activo } = req.body;
      const actualizado = await Profesor.findByIdAndUpdate(
        req.params.id,
        { telefono, departamento, oficina, activo, updatedAt: Date.now() },
        { new: true }
      )
      .populate('usuario', 'nombre_completo email');
      if (!actualizado) {
        return res.status(404).json({ message: 'Profesor no encontrado' });
      }
      res.status(200).json(actualizado);
    } catch (error) {
      res.status(400).json({ message: 'Error al actualizar profesor', error: error.message });
    }
  }
);

/**
 * DELETE /api/profesores/:id
 * “Borrar” un profesor (soft delete) (Administrador)
 */
router.delete(
  '/:id',
  authenticateToken,
  checkRole(['Administrador']),
  async (req, res) => {
    try {
      const eliminado = await Profesor.findByIdAndUpdate(
        req.params.id,
        { activo: false, updatedAt: Date.now() },
        { new: true }
      );
      if (!eliminado) {
        return res.status(404).json({ message: 'Profesor no encontrado' });
      }
      res.status(200).json({ message: 'Profesor desactivado correctamente' });
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar profesor', error: error.message });
    }
  }
);

module.exports = router;
