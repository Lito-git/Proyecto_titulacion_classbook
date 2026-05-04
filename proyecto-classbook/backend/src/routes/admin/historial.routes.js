// Importamos las dependencias necesarias
const express = require('express');
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const { obtenerHistorial, obtenerTotalHistorial } = require('../../controllers/admin/historial.controller');

// GET /historial/total → total de registros para el dashboard
router.get('/total', verificarToken, obtenerTotalHistorial);

// GET /historial → historial completo con filtros opcionales
router.get('/', verificarToken, obtenerHistorial);

module.exports = router;