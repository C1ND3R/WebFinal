// models/trayectoriaAsignatura.js
const mongoose = require('mongoose');

const trayectoriaAsignaturaSchema = new mongoose.Schema({
  profesor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesor',
    required: true
  },
  asignatura: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asignatura',
    required: true
  },
  periodo: {
    type: String,
    required: true
  },
  anio: {
    type: Number,
    required: true
  },
  grupo: {
    type: String,
    required: true
  },
  comentarios: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índice único para evitar duplicados de asignaciones
trayectoriaAsignaturaSchema.index(
  { profesor: 1, asignatura: 1, periodo: 1, anio: 1, grupo: 1 },
  { unique: true }
);

module.exports = mongoose.model('TrayectoriaAsignatura', trayectoriaAsignaturaSchema);
