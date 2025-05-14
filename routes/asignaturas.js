// routes/asignaturas.js
const express = require('express');
const router = express.Router();
const Asignatura = require('../models/asignaturas');
const { checkRole } = require('../middleware/auth');

router.get('/buscar', async (req, res) => {
  try {
    const { nombre, codigo, departamento } = req.query;
    const filtro = { activo: true };
    if (nombre)       filtro.nombre      = { $regex: nombre,      $options: 'i' };
    if (codigo)       filtro.codigo      = { $regex: codigo,      $options: 'i' };
    if (departamento) filtro.departamento = { $regex: departamento, $options: 'i' };

    const asignaturas = await Asignatura.find(filtro);
    res.status(200).json(asignaturas);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar asignaturas', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const asignaturas = await Asignatura.find({ activo: true });
    res.status(200).json(asignaturas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las asignaturas', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const asignatura = await Asignatura.findById(req.params.id);
    if (!asignatura) return res.status(404).json({ message: 'Asignatura no encontrada' });
    res.status(200).json(asignatura);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la asignatura', error: error.message });
  }
});

router.post('/', checkRole(['Administrador']), async (req, res) => {
  try {
    const nueva = new Asignatura(req.body);
    const guardada = await nueva.save();
    res.status(201).json(guardada);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear la asignatura', error: error.message });
  }
});

router.put('/:id', checkRole(['Administrador']), async (req, res) => {
  try {
    const actualizada = await Asignatura.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!actualizada) return res.status(404).json({ message: 'Asignatura no encontrada' });
    res.status(200).json(actualizada);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar la asignatura', error: error.message });
  }
});

router.delete('/:id', checkRole(['Administrador']), async (req, res) => {
  try {
    const desactivada = await Asignatura.findByIdAndUpdate(
      req.params.id,
      { activo: false, updatedAt: Date.now() },
      { new: true }
    );
    if (!desactivada) return res.status(404).json({ message: 'Asignatura no encontrada' });
    res.status(200).json({ message: 'Asignatura desactivada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar la asignatura', error: error.message });
  }
});

module.exports = router;

