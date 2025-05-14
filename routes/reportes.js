// routes/reportes.js

const express = require('express');
const router  = express.Router();
const TrayectoriaAsignatura = require('../models/trayectoriaAsignatura');
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * GET /api/reportes
 * Query params (opcionales):
 *   profesor    = ObjectId de Profesor
 *   asignatura  = ObjectId de Asignatura
 *   fechaInicio = YYYY-MM-DD
 *   fechaFin    = YYYY-MM-DD
 */
router.get(
  '/',
  authenticateToken,
  checkRole(['Administrador', 'Coordinador']),
  async (req, res) => {
    try {
      const { profesor, asignatura, fechaInicio, fechaFin } = req.query;

      // Montamos el filtro usando updatedAt en lugar de createdAt
      const filtro = {};
      if (profesor)   filtro.profesor    = profesor;
      if (asignatura) filtro.asignatura  = asignatura;
      if (fechaInicio || fechaFin) {
        filtro.updatedAt = {};
        if (fechaInicio) filtro.updatedAt.$gte = new Date(fechaInicio);
        if (fechaFin)    filtro.updatedAt.$lte = new Date(fechaFin);
      }

      // Consultamos la colección de trayectorias
      const trayectorias = await TrayectoriaAsignatura
        .find(filtro)
        .populate({
          path: 'profesor',
          populate: { path: 'usuario', select: 'nombre_completo' }
        })
        .populate('asignatura', 'nombre')
        .sort({ updatedAt: -1 });

      // Mapear al formato que espera el front
      const reportes = trayectorias.map(t => ({
        id:          t._id,
        titulo:      `${t.profesor.usuario.nombre_completo} – ${t.asignatura.nombre}`,
        descripcion: `Periodo ${t.periodo}, Año ${t.anio}, Grupo ${t.grupo}`,
        createdAt:   t.updatedAt
      }));

      res.json(reportes);
    } catch (error) {
      console.error('Error en GET /api/reportes:', error);
      res.status(500).json({ message: 'Error al generar reportes', error: error.message });
    }
  }
);

module.exports = router;
