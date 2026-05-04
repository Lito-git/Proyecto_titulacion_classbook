// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const { obtenerAsignaturas, crearAsignatura, editarAsignatura, eliminarAsignatura } = require('../../controllers/admin/asignaturas.controller');


// GET /asignaturas -> obtiene todas las asignaturas
router.get('/', verificarToken, obtenerAsignaturas);

// POST /asignaturas -> crea una nueva asignatura
router.post('/', verificarToken, crearAsignatura);

// PUT /asignaturas/:id -> edita una asignatura existente
router.put('/:id', verificarToken, editarAsignatura);

// DELETE /asignaturas/:id -> elimina una asignatura
router.delete('/:id', verificarToken, eliminarAsignatura);

module.exports = router;