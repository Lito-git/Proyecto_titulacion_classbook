// Importamos la conexión a la base de datos
const db = require('../config/db');

// Obtener todos los registros del historial de cambios
// con filtros opcionales por tipo de cambio, usuario y rango de fechas
const obtenerHistorial = async (req, res) => {
    const { tipo, usuario_id, fecha_inicio, fecha_fin } = req.query;

    try {
        // Construimos la consulta base con JOIN para obtener el nombre del usuario
        let query = `
      SELECT h.*, u.usuario_nombre, u.usuario_apellido
      FROM historial_cambios h
      JOIN usuarios u ON h.historial_usuario_id = u.usuario_id
      WHERE 1=1
    `;
        const params = [];

        // Agregamos filtros dinámicamente según los parámetros recibidos
        if (tipo) {
            query += ' AND h.historial_tipo_cambio = ?';
            params.push(tipo);
        }
        if (usuario_id) {
            query += ' AND h.historial_usuario_id = ?';
            params.push(usuario_id);
        }
        if (fecha_inicio) {
            query += ' AND DATE(h.historial_fecha_cambio) >= ?';
            params.push(fecha_inicio);
        }
        if (fecha_fin) {
            query += ' AND DATE(h.historial_fecha_cambio) <= ?';
            params.push(fecha_fin);
        }

        query += ' ORDER BY h.historial_fecha_cambio DESC';

        const [historial] = await db.query(query, params);
        res.json(historial);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener historial.', error: error.message });
    }
};

module.exports = { obtenerHistorial };