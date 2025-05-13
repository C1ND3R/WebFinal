//models/asignatura.js
const mongoose = require('mongoose');

const asignaturaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  descripcion: String,
  creditos: {
    type: Number,
    required: true
  },
  nivel: String,
  departamento: String,
  activo: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Asignatura', asignaturaSchema);


