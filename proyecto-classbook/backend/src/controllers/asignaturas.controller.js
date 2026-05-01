// Importamos la conexión a la base de datos
const db = require('../config/db');

// Obtener todas las asignaturas
const obtenerAsignaturas = async (req, res) => {
    try {
        const [asignaturas] = await db.query(
            'SELECT * FROM asignaturas ORDER BY asignatura_id ASC'
        );
        res.json(asignaturas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener asignaturas.', error: error.message });
    }
};

// Crear una nueva asignatura
const crearAsignatura = async (req, res) => {
    const { nombre, descripcion } = req.body;
    try {
        await db.query(
            'INSERT INTO asignaturas (asignatura_nombre, asignatura_descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );
        res.json({ mensaje: 'Asignatura creada correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear asignatura.', error: error.message });
    }
};

// Editar una asignatura existente
const editarAsignatura = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    try {
        await db.query(
            'UPDATE asignaturas SET asignatura_nombre = ?, asignatura_descripcion = ? WHERE asignatura_id = ?',
            [nombre, descripcion, id]
        );
        res.json({ mensaje: 'Asignatura actualizada correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al editar asignatura.', error: error.message });
    }
};

// Eliminar una asignatura — verifica dependencias antes de borrar
const eliminarAsignatura = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificamos si hay calificaciones asociadas
        const [enCalificaciones] = await db.query(
            'SELECT COUNT(*) AS total FROM calificaciones WHERE calificacion_asignatura_id = ?',
            [id]
        );
        if (enCalificaciones[0].total > 0) {
            return res.status(400).json({
                mensaje: 'No se puede eliminar: la asignatura tiene calificaciones registradas.'
            });
        }

        // Verificamos si hay docentes asignados
        const [enDocentes] = await db.query(
            'SELECT COUNT(*) AS total FROM docente_asignatura WHERE asignatura_id = ?',
            [id]
        );
        if (enDocentes[0].total > 0) {
            return res.status(400).json({
                mensaje: 'No se puede eliminar: la asignatura tiene docentes asignados.'
            });
        }

        await db.query('DELETE FROM asignaturas WHERE asignatura_id = ?', [id]);
        res.json({ mensaje: 'Asignatura eliminada correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar asignatura.', error: error.message });
    }
};

module.exports = { obtenerAsignaturas, crearAsignatura, editarAsignatura, eliminarAsignatura };