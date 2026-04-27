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

// Eliminar una asignatura
const eliminarAsignatura = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM asignaturas WHERE asignatura_id = ?', [id]);
        res.json({ mensaje: 'Asignatura eliminada correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar asignatura.', error: error.message });
    }
};

module.exports = { obtenerAsignaturas, crearAsignatura, editarAsignatura, eliminarAsignatura };