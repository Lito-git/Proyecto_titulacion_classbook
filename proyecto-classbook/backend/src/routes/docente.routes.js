// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth');
const {
    obtenerAsignaciones,
    obtenerEstudiantesPorCurso,
    obtenerEstudiantesDelDocente,
    obtenerCalificaciones,
    registrarCalificacion,
    modificarCalificacion,
    obtenerAnotaciones,
    registrarAnotacion,
    obtenerResumenDocente
} = require('../controllers/docente.controller');

// GET /docente/:id/resumen → dashboard del docente
router.get('/:id/resumen', verificarToken, obtenerResumenDocente);

// GET /docente/:id/asignaciones → cursos y asignaturas del docente
router.get('/:id/asignaciones', verificarToken, obtenerAsignaciones);

// GET /docente/curso/:curso_id/estudiantes → estudiantes de un curso específico
router.get('/curso/:curso_id/estudiantes', verificarToken, obtenerEstudiantesPorCurso);

// GET /docente/:id/estudiantes → todos los estudiantes de todos los cursos del docente
// Usado en el módulo de anotaciones
router.get('/:id/estudiantes', verificarToken, obtenerEstudiantesDelDocente);

// GET /docente/calificaciones/:curso_id/:asignatura_id → calificaciones del curso+asignatura
router.get('/calificaciones/:curso_id/:asignatura_id', verificarToken, obtenerCalificaciones);

// POST /docente/calificaciones → registrar nueva calificación
router.post('/calificaciones', verificarToken, registrarCalificacion);

// PUT /docente/calificaciones/:id → modificar calificación existente
router.put('/calificaciones/:id', verificarToken, modificarCalificacion);

// GET /docente/:id/anotaciones → anotaciones del docente
router.get('/:id/anotaciones', verificarToken, obtenerAnotaciones);

// POST /docente/anotaciones → registrar nueva anotación
router.post('/anotaciones', verificarToken, registrarAnotacion);

module.exports = router;