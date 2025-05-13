/// models/evaluacion.js
const mongoose = require('mongoose');

const evaluacionSchema = new mongoose.Schema({
  trayectoriaAsignatura: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrayectoriaAsignatura',
    required: true
  },
  evaluador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true              
  },
  puntuacion: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  comentario: String,
  aspectos_positivos: [String],
  aspectos_mejorar: [String],
  fecha_evaluacion: {
    type: Date,
    default: Date.now
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

module.exports = mongoose.model('Evaluacion', evaluacionSchema);
