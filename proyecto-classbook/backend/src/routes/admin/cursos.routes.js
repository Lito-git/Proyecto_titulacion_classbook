// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const { obtenerCursos, crearCurso, editarCurso, eliminarCurso } = require('../../controllers/admin/cursos.controller');


// GET /cursos -> obtiene todos los cursos
router.get('/', verificarToken, obtenerCursos);

// POST /cursos -> crea un nuevo curso
router.post('/', verificarToken, crearCurso);

// PUT /cursos/:id -> edita un curso existente
router.put('/:id', verificarToken, editarCurso);

// DELETE /cursos/:id -> elimina un curso
router.delete('/:id', verificarToken, eliminarCurso);

module.exports = router;