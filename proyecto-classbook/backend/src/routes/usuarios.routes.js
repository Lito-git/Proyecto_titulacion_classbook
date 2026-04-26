// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth');
const {
    obtenerUsuarios,
    crearUsuario,
    editarUsuario,
    resetearContrasena,
    obtenerRoles
} = require('../controllers/usuarios.controller');

// Todas las rutas de usuarios requieren token JWT válido
// Solo el administrador puede acceder a estas rutas (el control de rol lo haremos en el frontend por ahora)

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

module.exports = router;