// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth');
const { obtenerHistorial, obtenerTotalHistorial } = require('../controllers/historial.controller');

// GET /historial/total → total de registros para el dashboard
// IMPORTANTE: esta ruta debe ir ANTES de la ruta GET / para que no sea interceptada
router.get('/total', verificarToken, obtenerTotalHistorial);

// GET /historial → historial completo con filtros opcionales
router.get('/', verificarToken, obtenerHistorial);

module.exports = router;