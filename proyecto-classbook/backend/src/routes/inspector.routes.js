// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth');
const {
    obtenerResumenInspector,
    obtenerReportes,
    obtenerAnotaciones,
    obtenerCursos,
    obtenerAsignaturas
} = require('../controllers/inspector.controller');

// GET /inspector/resumen → resumen para el dashboard
router.get('/resumen', verificarToken, obtenerResumenInspector);

// GET /inspector/reportes → reportes de rendimiento con filtros
router.get('/reportes', verificarToken, obtenerReportes);

// GET /inspector/anotaciones → anotaciones del establecimiento con filtros
router.get('/anotaciones', verificarToken, obtenerAnotaciones);

// GET /inspector/cursos → lista de cursos para filtros
router.get('/cursos', verificarToken, obtenerCursos);

// GET /inspector/asignaturas → lista de asignaturas para filtros
router.get('/asignaturas', verificarToken, obtenerAsignaturas);

module.exports = router;