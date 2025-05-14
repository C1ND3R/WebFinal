// routes/reportes.js
const express = require('express');
const router = express.Router();

// Modelos (rutas relativas a /routes)
const TrayectoriaAsignatura = require('../models/trayectoriaAsignatura');
const Evaluacion            = require('../models/evaluacion');

// Middleware de autenticación y autorización
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * GET /api/reportes
 * Query params:
 *   - profesor    (ObjectId)
 *   - asignatura  (ObjectId)
 *   - fechaInicio (ISO date)
 *   - fechaFin    (ISO date)
 *
 * Devuelve un listado de reportes basados en Trayectorias de Asignatura
 * con conteo de evaluaciones en el rango de fechas indicado.
 */
router.get(
  '/',
  authenticateToken,
  checkRole(['Administrador']),
  async (req, res) => {
    try {
      const { profesor, asignatura, fechaInicio, fechaFin } = req.query;

      // Armar filtro para trayectorias
      const filtroTray = { activo: true };
      if (profesor)    filtroTray.profesor    = profesor;
      if (asignatura)  filtroTray.asignatura  = asignatura;

      // Traer trayectorias con populate
      const trayectorias = await TrayectoriaAsignatura
        .find(filtroTray)
        .populate({ path: 'profesor', select: 'usuario' })
        .populate({ path: 'asignatura', select: 'nombre' });

      // Para cada trayectoria, contar evaluaciones en el rango
      const reportes = await Promise.all(trayectorias.map(async t => {
        const filtroEval = { trayectoriaAsignatura: t._id };

        if (fechaInicio || fechaFin) {
          filtroEval.fecha_evaluacion = {};
          if (fechaInicio) filtroEval.fecha_evaluacion.$gte = new Date(fechaInicio);
          if (fechaFin)    filtroEval.fecha_evaluacion.$lte = new Date(fechaFin);
        }

        const totalEvaluaciones = await Evaluacion.countDocuments(filtroEval);

        return {
          id:          t._id,
          titulo:      `Profesor: ${t.profesor.usuario.nombre_completo}`,
          descripcion: `${t.asignatura.nombre} → ${totalEvaluaciones} evaluación(es)`,
          createdAt:   t.createdAt
        };
      }));

      res.json(reportes);
    } catch (error) {
      console.error('Error generando reportes:', error);
      res.status(500).json({
        message: 'Error al generar reportes',
        error: error.message
      });
    }
  }
);

module.exports = router;

