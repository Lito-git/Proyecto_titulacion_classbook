// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth');
const {
    obtenerAsignaciones,
    obtenerEstudiantesPorCurso,
    obtenerCalificaciones,
    registrarCalificacion,
    modificarCalificacion,
    obtenerAnotaciones,
    registrarAnotacion,
    obtenerResumenDocente
} = require('../controllers/docente.controller');

// Todas las rutas requieren token JWT válido

// GET /docente/:id/asignaciones -> obtiene los cursos y asignaturas del docente
router.get('/:id/asignaciones', verificarToken, obtenerAsignaciones);

// GET /docente/:id/resumen -> obtiene el resumen para el dashboard
router.get('/:id/resumen', verificarToken, obtenerResumenDocente);

// GET /docente/curso/:curso_id/estudiantes -> obtiene estudiantes de un curso
router.get('/curso/:curso_id/estudiantes', verificarToken, obtenerEstudiantesPorCurso);

// GET /docente/calificaciones/:curso_id/:asignatura_id -> obtiene calificaciones
router.get('/calificaciones/:curso_id/:asignatura_id', verificarToken, obtenerCalificaciones);

// POST /docente/calificaciones -> registra una nueva calificación
router.post('/calificaciones', verificarToken, registrarCalificacion);

// PUT /docente/calificaciones/:id -> modifica una calificación existente
router.put('/calificaciones/:id', verificarToken, modificarCalificacion);

// GET /docente/:id/anotaciones -> obtiene anotaciones del docente
router.get('/:id/anotaciones', verificarToken, obtenerAnotaciones);

// POST /docente/anotaciones -> registra una nueva anotación
router.post('/anotaciones', verificarToken, registrarAnotacion);

module.exports = router;