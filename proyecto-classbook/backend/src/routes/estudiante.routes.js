// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth');
const { obtenerResumenEstudiante, obtenerCalificaciones, obtenerAnotacionesPositivas } = require('../controllers/estudiante.controller');

// GET /estudiante/:id/resumen → resumen para el dashboard
router.get('/:id/resumen', verificarToken, obtenerResumenEstudiante);

// GET /estudiante/:id/calificaciones → calificaciones por asignatura
router.get('/:id/calificaciones', verificarToken, obtenerCalificaciones);

// GET /estudiante/:id/anotaciones-positivas → anotaciones positivas
router.get('/:id/anotaciones-positivas', verificarToken, obtenerAnotacionesPositivas);

module.exports = router;