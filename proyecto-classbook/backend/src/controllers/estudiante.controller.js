// Importamos la conexión a la base de datos
const db = require('../config/db');

// Obtener el resumen del dashboard del estudiante
const obtenerResumenEstudiante = async (req, res) => {
    const { id } = req.params;

    try {
        const [estudiante] = await db.query(
            'SELECT estudiante_id, estudiante_curso_id FROM estudiantes WHERE estudiante_usuario_id = ?',
            [id]
        );

        if (estudiante.length === 0) {
            return res.status(404).json({ mensaje: 'Estudiante no encontrado.' });
        }

        const estudianteId = estudiante[0].estudiante_id;

        const [promedio] = await db.query(
            `SELECT ROUND(AVG(calificacion_nota), 1) AS promedio
             FROM calificaciones
             WHERE calificacion_estudiante_id = ?`,
            [estudianteId]
        );

        const [anotacionesPositivas] = await db.query(
            `SELECT COUNT(*) AS total
             FROM anotaciones
             WHERE anotacion_estudiante_id = ? AND anotacion_tipo = 'positiva'`,
            [estudianteId]
        );

        const [evaluacionesMes] = await db.query(
            `SELECT COUNT(*) AS total
             FROM calificaciones
             WHERE calificacion_estudiante_id = ?
             AND MONTH(calificacion_fecha_registro) = MONTH(NOW())
             AND YEAR(calificacion_fecha_registro) = YEAR(NOW())`,
            [estudianteId]
        );

        const [calRecientes] = await db.query(
            `SELECT
                'calificacion' AS tipo,
                a.asignatura_nombre,
                c.calificacion_tipo,
                c.calificacion_numero,
                c.calificacion_nota,
                c.calificacion_fecha_registro AS fecha
             FROM calificaciones c
             JOIN asignaturas a ON a.asignatura_id = c.calificacion_asignatura_id
             WHERE c.calificacion_estudiante_id = ?
             ORDER BY c.calificacion_fecha_registro DESC
             LIMIT 3`,
            [estudianteId]
        );

        const [anotRecientes] = await db.query(
            `SELECT
                'anotacion' AS tipo,
                an.anotacion_descripcion,
                an.anotacion_fecha AS fecha
             FROM anotaciones an
             WHERE an.anotacion_estudiante_id = ? AND an.anotacion_tipo = 'positiva'
             ORDER BY an.anotacion_fecha DESC
             LIMIT 3`,
            [estudianteId]
        );

        const actividad = [...calRecientes, ...anotRecientes]
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .slice(0, 5);

        res.json({
            estudianteId,
            promedioGeneral: promedio[0].promedio || 0,
            totalAnotacionesPositivas: anotacionesPositivas[0].total,
            totalEvaluacionesMes: evaluacionesMes[0].total,
            actividadReciente: actividad
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener resumen.', error: error.message });
    }
};

// Obtener calificaciones del estudiante por asignatura
const obtenerCalificaciones = async (req, res) => {
    const { id } = req.params;

    try {
        const [estudiante] = await db.query(
            'SELECT estudiante_id FROM estudiantes WHERE estudiante_usuario_id = ?',
            [id]
        );

        if (estudiante.length === 0) {
            return res.status(404).json({ mensaje: 'Estudiante no encontrado.' });
        }

        const estudianteId = estudiante[0].estudiante_id;

        const [asignaturas] = await db.query(
            `SELECT DISTINCT a.asignatura_id, a.asignatura_nombre
             FROM calificaciones c
             JOIN asignaturas a ON a.asignatura_id = c.calificacion_asignatura_id
             WHERE c.calificacion_estudiante_id = ?`,
            [estudianteId]
        );

        const resultado = await Promise.all(asignaturas.map(async (asig) => {
            const [calificaciones] = await db.query(
                `SELECT calificacion_tipo, calificacion_numero, calificacion_nota
                 FROM calificaciones
                 WHERE calificacion_estudiante_id = ? AND calificacion_asignatura_id = ?`,
                [estudianteId, asig.asignatura_id]
            );

            const promedio = calificaciones.length > 0
                ? (calificaciones.reduce((acc, c) => acc + parseFloat(c.calificacion_nota), 0) / calificaciones.length).toFixed(1)
                : null;

            return { ...asig, calificaciones, promedio };
        }));

        const todasLasNotas = resultado.flatMap(a => a.calificaciones.map(c => parseFloat(c.calificacion_nota)));
        const promedioGeneral = todasLasNotas.length > 0
            ? (todasLasNotas.reduce((a, b) => a + b, 0) / todasLasNotas.length).toFixed(1)
            : 0;

        res.json({ asignaturas: resultado, promedioGeneral });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener calificaciones.', error: error.message });
    }
};

// Obtener anotaciones positivas del estudiante
const obtenerAnotacionesPositivas = async (req, res) => {
    const { id } = req.params;

    try {
        const [estudiante] = await db.query(
            'SELECT estudiante_id FROM estudiantes WHERE estudiante_usuario_id = ?',
            [id]
        );

        if (estudiante.length === 0) {
            return res.status(404).json({ mensaje: 'Estudiante no encontrado.' });
        }

        const estudianteId = estudiante[0].estudiante_id;

        // Subquery para traer solo una asignatura por profesor y evitar duplicados
        const [anotaciones] = await db.query(
            `SELECT
                an.anotacion_id,
                an.anotacion_descripcion,
                an.anotacion_fecha,
                u.usuario_nombre AS profesor_nombre,
                u.usuario_segundo_nombre AS profesor_segundo_nombre,
                u.usuario_apellido AS profesor_apellido,
                u.usuario_segundo_apellido AS profesor_segundo_apellido,
                (SELECT a2.asignatura_nombre
                 FROM docente_asignatura da2
                 JOIN asignaturas a2 ON a2.asignatura_id = da2.asignatura_id
                 WHERE da2.docente_usuario_id = an.anotacion_profesor_id
                 LIMIT 1) AS asignatura_nombre
             FROM anotaciones an
             JOIN usuarios u ON u.usuario_id = an.anotacion_profesor_id
             WHERE an.anotacion_estudiante_id = ? AND an.anotacion_tipo = 'positiva'
             ORDER BY an.anotacion_fecha DESC`,
            [estudianteId]
        );

        const [totalSemestre] = await db.query(
            `SELECT COUNT(*) AS total
             FROM anotaciones
             WHERE anotacion_estudiante_id = ? AND anotacion_tipo = 'positiva'`,
            [estudianteId]
        );

        res.json({
            anotaciones,
            totalSemestre: totalSemestre[0].total
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener anotaciones.', error: error.message });
    }
};

module.exports = { obtenerResumenEstudiante, obtenerCalificaciones, obtenerAnotacionesPositivas };