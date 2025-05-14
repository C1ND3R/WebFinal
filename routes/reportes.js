// routes/reportes.js
const express = require('express');
const router = express.Router();
const TrayectoriaAsignatura = require('./models/trayectoriaAsignatura');
const Evaluacion            = require('./models/evaluacion');
const { authenticateToken, checkRole } = require('./middleware/auth');

router.get('/', authenticateToken, checkRole(['Administrador']), async (req, res) => {
  try {
    const { profesor, asignatura, fechaInicio, fechaFin } = req.query;
    const filtroTray = { activo: true };
    if (profesor)    filtroTray.profesor    = profesor;
    if (asignatura)  filtroTray.asignatura  = asignatura;

    const trayectorias = await TrayectoriaAsignatura
      .find(filtroTray)
      .populate('profesor', 'usuario')
      .populate('asignatura', 'nombre');

    const reportes = await Promise.all(trayectorias.map(async t => {
      // contar evaluaciones en rango
      const fevals = { trayectoriaAsignatura: t._id };
      if (fechaInicio || fechaFin) {
        fevals.fecha_evaluacion = {};
        if (fechaInicio) fevals.fecha_evaluacion.$gte = new Date(fechaInicio);
        if (fechaFin)    fevals.fecha_evaluacion.$lte = new Date(fechaFin);
      }
      const total = await Evaluacion.countDocuments(fevals);
      return {
        id: t._id,
        titulo: `Profesor: ${t.profesor.usuario.nombre_completo}`,
        descripcion: `${t.asignatura.nombre} → ${total} evaluación(es)`,
        createdAt: t.createdAt
      };
    }));

    res.json(reportes);
  } catch (error) {
    res.status(500).json({ message: 'Error al generar reportes', error: error.message });
  }
});

module.exports = router;
