// Importamos la conexión a la base de datos
const db = require('../config/db');

// Obtener todos los cursos con el conteo de estudiantes matriculados
const obtenerCursos = async (req, res) => {
    try {
        const [cursos] = await db.query(
            `SELECT c.*, COUNT(e.estudiante_id) AS total_estudiantes
             FROM cursos c
             LEFT JOIN estudiantes e ON e.estudiante_curso_id = c.curso_id
             GROUP BY c.curso_id
             ORDER BY c.curso_id ASC`
        );
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener cursos.', error: error.message });
    }
};

// Crear un nuevo curso
const crearCurso = async (req, res) => {
    const { nombre, nivel } = req.body;
    try {
        const nombreCompleto = `${nivel} ${nombre}`;
        await db.query(
            'INSERT INTO cursos (curso_nombre, curso_nivel) VALUES (?, ?)',
            [nombreCompleto, nivel]
        );
        res.json({ mensaje: 'Curso creado correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear curso.', error: error.message });
    }
};

// Editar un curso existente
const editarCurso = async (req, res) => {
    const { id } = req.params;
    const { nombre, nivel } = req.body;
    try {
        const nombreCompleto = `${nivel} ${nombre}`;
        await db.query(
            'UPDATE cursos SET curso_nombre = ?, curso_nivel = ? WHERE curso_id = ?',
            [nombreCompleto, nivel, id]
        );
        res.json({ mensaje: 'Curso actualizado correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al editar curso.', error: error.message });
    }
};

// Eliminar un curso — verifica dependencias antes de borrar
const eliminarCurso = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificamos si hay estudiantes matriculados en el curso
        const [conEstudiantes] = await db.query(
            'SELECT COUNT(*) AS total FROM estudiantes WHERE estudiante_curso_id = ?',
            [id]
        );
        if (conEstudiantes[0].total > 0) {
            return res.status(400).json({
                mensaje: 'No se puede eliminar: el curso tiene estudiantes matriculados.'
            });
        }

        // Verificamos si hay docentes asignados al curso
        const [conDocentes] = await db.query(
            'SELECT COUNT(*) AS total FROM docente_asignatura WHERE curso_id = ?',
            [id]
        );
        if (conDocentes[0].total > 0) {
            return res.status(400).json({
                mensaje: 'No se puede eliminar: el curso tiene docentes asignados.'
            });
        }

        await db.query('DELETE FROM cursos WHERE curso_id = ?', [id]);
        res.json({ mensaje: 'Curso eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar curso.', error: error.message });
    }
};

module.exports = { obtenerCursos, crearCurso, editarCurso, eliminarCurso };