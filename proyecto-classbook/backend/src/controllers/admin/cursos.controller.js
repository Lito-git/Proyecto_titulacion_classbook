// Importamos la conexión a la base de datos
const db = require('../../config/db');

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

// Eliminar un curso verificando que no tenga usuarios ACTIVOS
const eliminarCurso = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificamos si hay estudiantes con usuario activo matriculados en el curso
        const [conEstudiantes] = await db.query(
            `SELECT COUNT(*) AS total 
             FROM estudiantes e
             JOIN usuarios u ON u.usuario_id = e.estudiante_usuario_id
             WHERE e.estudiante_curso_id = ? AND u.usuario_activo = 1`,
            [id]
        );
        if (conEstudiantes[0].total > 0) {
            return res.status(400).json({
                mensaje: 'No se puede eliminar: el curso tiene estudiantes activos. Desactívalos primero desde Gestión de Usuarios.'
            });
        }

        // Verificamos si hay docentes con usuario activo asignados al curso
        const [conDocentes] = await db.query(
            `SELECT COUNT(*) AS total
             FROM docente_asignatura da
             JOIN usuarios u ON u.usuario_id = da.docente_usuario_id
             WHERE da.curso_id = ? AND u.usuario_activo = 1`,
            [id]
        );
        if (conDocentes[0].total > 0) {
            return res.status(400).json({
                mensaje: 'No se puede eliminar: el curso tiene docentes activos. Desactívalos primero desde Gestión de Usuarios.'
            });
        }

        await db.query('DELETE FROM cursos WHERE curso_id = ?', [id]);
        res.json({ mensaje: 'Curso eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar curso.', error: error.message });
    }
};

module.exports = { obtenerCursos, crearCurso, editarCurso, eliminarCurso };