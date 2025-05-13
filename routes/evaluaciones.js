// routes/evaluaciones.js
const express = require('express');
const router = express.Router();
const Evaluacion = require('../models/evaluacion');
const TrayectoriaAsignatura = require('../models/trayectoriaAsignatura');
const { checkRole } = require('../middleware/auth');

// 1) Obtener evaluaciones para una trayectoria específica
// GET /api/evaluaciones/trayectoria/:id
router.get(
  '/trayectoria/:id',
  checkRole(['Administrador', 'Coordinador']),
  async (req, res) => {
    try {
      const evaluaciones = await Evaluacion.find({ trayectoriaAsignatura: req.params.id })
        .populate({ path: 'evaluador', select: 'nombre_completo rol' })
        .sort({ fecha_evaluacion: -1 });

      if (evaluaciones.length === 0) {
        return res
          .status(200)
          .json({ message: 'No hay evaluaciones para esta trayectoria', evaluaciones: [] });
      }

      res.status(200).json(evaluaciones);
    } catch (error) {
      res.status(500).json({
        message: 'Error al obtener las evaluaciones de la trayectoria',
        error: error.message
      });
    }
  }
);

// 2) Crear una nueva evaluación
// POST /api/evaluaciones
router.post(
  '/',
  checkRole(['Coordinador', 'Alumno']),
  async (req, res) => {
    try {
      const trayectoria = await TrayectoriaAsignatura.findById(
        req.body.trayectoriaAsignatura
      );
      if (!trayectoria) {
        return res
          .status(404)
          .json({ message: 'Trayectoria de asignatura no encontrada' });
      }

      const nuevaEvaluacion = new Evaluacion({
        trayectoriaAsignatura: req.body.trayectoriaAsignatura,
        evaluador: req.user.id,
        puntuacion: req.body.puntuacion,
        comentario: req.body.comentario,
        aspectos_positivos: req.body.aspectos_positivos,
        aspectos_mejorar: req.body.aspectos_mejorar
      });

      const evaluacionGuardada = await nuevaEvaluacion.save();
      res.status(201).json(evaluacionGuardada);
    } catch (error) {
      res.status(400).json({
        message: 'Error al crear la evaluación',
        error: error.message
      });
    }
  }
);

// 3) Obtener todas las evaluaciones de un profesor
// GET /api/evaluaciones/profesor/:id
router.get(
  '/profesor/:id',
  checkRole(['Administrador', 'Coordinador']),
  async (req, res) => {
    try {
      const trayectorias = await TrayectoriaAsignatura.find({ profesor: req.params.id });
      if (trayectorias.length === 0) {
        return res
          .status(200)
          .json({ message: 'El profesor no tiene trayectorias para evaluar', evaluaciones: [] });
      }

      const trayectoriaIds = trayectorias.map(t => t._id);
      const evaluaciones = await Evaluacion.find({
        trayectoriaAsignatura: { $in: trayectoriaIds }
      })
        .populate({
          path: 'trayectoriaAsignatura',
          populate: { path: 'asignatura', select: 'nombre codigo' }
        })
        .populate({ path: 'evaluador', select: 'nombre_completo rol' })
        .sort({ fecha_evaluacion: -1 });

      // Calcular promedio
      let promedio = 0;
      if (evaluaciones.length > 0) {
        promedio =
          evaluaciones.reduce((sum, e) => sum + e.puntuacion, 0) /
          evaluaciones.length;
      }

      res.status(200).json({
        evaluaciones,
        promedio,
        total_evaluaciones: evaluaciones.length
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error al obtener las evaluaciones del profesor',
        error: error.message
      });
    }
  }
);

// 4) Obtener evaluaciones por asignatura
// GET /api/evaluaciones/asignatura/:id
router.get(
  '/asignatura/:id',
  checkRole(['Administrador', 'Coordinador']),
  async (req, res) => {
    try {
      const trayectorias = await TrayectoriaAsignatura.find({ asignatura: req.params.id })
        .populate('profesor', 'nombre_completo');

      if (trayectorias.length === 0) {
        return res
          .status(200)
          .json({ message: 'No hay trayectorias para esta asignatura', evaluaciones: [] });
      }

      const trayectoriaIds = trayectorias.map(t => t._id);
      const evaluaciones = await Evaluacion.find({
        trayectoriaAsignatura: { $in: trayectoriaIds }
      })
        .populate({
          path: 'trayectoriaAsignatura',
          populate: [
            { path: 'profesor', select: 'nombre_completo' },
            { path: 'asignatura', select: 'nombre codigo' }
          ]
        })
        .sort({ fecha_evaluacion: -1 });

      // Agrupar y calcular promedio por profesor
      const evaluacionesPorProfesor = {};

      evaluaciones.forEach(e => {
        const pid = e.trayectoriaAsignatura.profesor._id.toString();
        const nombre = e.trayectoriaAsignatura.profesor.nombre_completo;
        if (!evaluacionesPorProfesor[pid]) {
          evaluacionesPorProfesor[pid] = { profesor: nombre, evaluaciones: [], promedio: 0 };
        }
        evaluacionesPorProfesor[pid].evaluaciones.push(e);
      });

      Object.values(evaluacionesPorProfesor).forEach(group => {
        group.promedio =
          group.evaluaciones.reduce((sum, e) => sum + e.puntuacion, 0) /
          group.evaluaciones.length;
      });

      res.status(200).json({
        asignatura_id: req.params.id,
        evaluaciones_por_profesor: evaluacionesPorProfesor,
        total_evaluaciones: evaluaciones.length
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error al obtener las evaluaciones por asignatura',
        error: error.message
      });
    }
  }
);

// 5) Actualizar una evaluación existente
// PUT /api/evaluaciones/:id
router.put('/:id', async (req, res) => {
  try {
    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) {
      return res.status(404).json({ message: 'Evaluación no encontrada' });
    }

    if (
      req.user.rol !== 'Administrador' &&
      req.user.rol !== 'Coordinador' &&
      evaluacion.evaluador.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'No autorizado para modificar esta evaluación' });
    }

    const actualizada = await Evaluacion.findByIdAndUpdate(
      req.params.id,
      {
        puntuacion: req.body.puntuacion,
        comentario: req.body.comentario,
        aspectos_positivos: req.body.aspectos_positivos,
        aspectos_mejorar: req.body.aspectos_mejorar,
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.status(200).json(actualizada);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar la evaluación', error: error.message });
  }
});

// 6) Eliminar una evaluación
// DELETE /api/evaluaciones/:id
router.delete('/:id', async (req, res) => {
  try {
    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) {
      return res.status(404).json({ message: 'Evaluación no encontrada' });
    }

    if (
      req.user.rol !== 'Administrador' &&
      evaluacion.evaluador.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'No autorizado para eliminar esta evaluación' });
    }

    await Evaluacion.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Evaluación eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la evaluación', error: error.message });
  }
});

module.exports = router;
