// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const {
    obtenerUsuarios,
    crearUsuario,
    editarUsuario,
    resetearContrasena,
    obtenerRoles,
    toggleActivoUsuario,
    eliminarUsuario
} = require('../../controllers/admin/usuarios.controller');

// GET /usuarios -> obtiene todos los usuarios
router.get('/', verificarToken, obtenerUsuarios);

// GET /usuarios/roles -> obtiene todos los roles disponibles
router.get('/roles', verificarToken, obtenerRoles);

// POST /usuarios -> crea un nuevo usuario y envía contraseña temporal por correo
router.post('/', verificarToken, crearUsuario);

// PUT /usuarios/:id -> edita un usuario existente
router.put('/:id', verificarToken, editarUsuario);

// POST /usuarios/:id/resetear-contrasena -> resetea la contraseña del usuario
router.post('/:id/resetear-contrasena', verificarToken, resetearContrasena);

// PATCH /usuarios/:id/toggle-activo -> activa o desactiva un usuario
router.patch('/:id/toggle-activo', verificarToken, toggleActivoUsuario);

// DELETE /usuarios/:id → eliminar físicamente un usuario y todos sus datos
router.delete('/:id', verificarToken, eliminarUsuario);

module.exports = router;