// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth');
const { obtenerHistorial } = require('../controllers/historial.controller');

// Todas las rutas requieren token JWT válido

// GET /historial -> obtiene todos los registros del historial con filtros opcionales
// Parámetros query opcionales: tipo, usuario_id, fecha_inicio, fecha_fin
router.get('/', verificarToken, obtenerHistorial);

module.exports = router;