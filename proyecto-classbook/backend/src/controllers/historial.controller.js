// Importamos la conexión a la base de datos
const db = require('../config/db');

// Obtener el total de registros del historial (para el dashboard del admin)
const obtenerTotalHistorial = async (req, res) => {
    try {
        const [resultado] = await db.query(
            'SELECT COUNT(*) AS total FROM historial_cambios'
        );
        res.json({ total: resultado[0].total });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener total del historial.', error: error.message });
    }
};

// Obtener registros del historial con filtros opcionales
// Soporta parámetro limit para el dashboard (evita traer toda la tabla)
const obtenerHistorial = async (req, res) => {
    const { tipo, usuario_id, fecha_inicio, fecha_fin, limit } = req.query;

    try {
        let query = `
            SELECT h.*,
                u.usuario_nombre,
                u.usuario_segundo_nombre,
                u.usuario_apellido,
                u.usuario_segundo_apellido
            FROM historial_cambios h
            JOIN usuarios u ON h.historial_usuario_id = u.usuario_id
            WHERE 1=1
        `;
        const params = [];

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

        // Soporte para limit — usado por el dashboard para no traer toda la tabla
        if (limit && !isNaN(parseInt(limit))) {
            query += ` LIMIT ?`;
            params.push(parseInt(limit));
        }

        const [historial] = await db.query(query, params);
        res.json(historial);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener historial.', error: error.message });
    }
};

module.exports = { obtenerHistorial, obtenerTotalHistorial };