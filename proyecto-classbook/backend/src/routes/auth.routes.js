// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const { login, cambiarContrasena, recuperarContrasena } = require('../controllers/auth.controller');
const verificarToken = require('../middleware/auth');

// Ruta pública (no requiere token)
// POST /auth/login -> valida credenciales y retorna token JWT
router.post('/login', login);

// Ruta pública (no requiere token)
// POST /auth/recuperar-contrasena -> envía nueva contraseña temporal al correo
router.post('/recuperar-contrasena', recuperarContrasena);

// Ruta protegida (requiere token JWT válido)
// POST /auth/cambiar-contrasena -> cambia la contraseña del usuario autenticado
router.post('/cambiar-contrasena', verificarToken, cambiarContrasena);

module.exports = router;