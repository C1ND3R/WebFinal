// models/profesor.js
const mongoose = require('mongoose');

const profesorSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  departamento: {
    type: String,
    required: true
  },
  oficina: String,

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

module.exports = mongoose.model('Profesor', profesorSchema);
