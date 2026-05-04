// Importamos la conexión a la base de datos
const db = require('../config/db');

// Obtener las asignaciones del docente (curso + asignatura)
const obtenerAsignaciones = async (req, res) => {
    const { id } = req.params;
    try {
        const [asignaciones] = await db.query(
            `SELECT
                da.docente_asignatura_id,
                da.curso_id,
                da.asignatura_id,
                c.curso_nombre,
                c.curso_nivel,
                a.asignatura_nombre,
                COUNT(e.estudiante_id) AS total_estudiantes
             FROM docente_asignatura da
             JOIN cursos c ON c.curso_id = da.curso_id
             JOIN asignaturas a ON a.asignatura_id = da.asignatura_id
             LEFT JOIN estudiantes e ON e.estudiante_curso_id = da.curso_id
             WHERE da.docente_usuario_id = ?
             GROUP BY da.docente_asignatura_id`,
            [id]
        );
        res.json(asignaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener asignaciones.', error: error.message });
    }
};

// Obtener los estudiantes de un curso específico
const obtenerEstudiantesPorCurso = async (req, res) => {
    const { curso_id } = req.params;
    try {
        const [estudiantes] = await db.query(
            `SELECT
                e.estudiante_id,
                u.usuario_nombre,
                u.usuario_segundo_nombre,
                u.usuario_apellido,
                u.usuario_segundo_apellido,
                e.estudiante_rut
             FROM estudiantes e
             JOIN usuarios u ON u.usuario_id = e.estudiante_usuario_id
             WHERE e.estudiante_curso_id = ?
             AND u.usuario_activo = 1
             ORDER BY u.usuario_apellido ASC`,
            [curso_id]
        );
        res.json(estudiantes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener estudiantes.', error: error.message });
    }
};

// Obtener todos los estudiantes de todos los cursos asignados al docente que usará el módulo de anotaciones para mostrar estudiantes de todos sus cursos
const obtenerEstudiantesDelDocente = async (req, res) => {
    const { id } = req.params;
    try {
        const [estudiantes] = await db.query(
            `SELECT DISTINCT
                e.estudiante_id,
                u.usuario_nombre,
                u.usuario_segundo_nombre,
                u.usuario_apellido,
                u.usuario_segundo_apellido,
                e.estudiante_rut,
                c.curso_nombre
             FROM docente_asignatura da
             JOIN estudiantes e ON e.estudiante_curso_id = da.curso_id
             JOIN usuarios u ON u.usuario_id = e.estudiante_usuario_id
             JOIN cursos c ON c.curso_id = e.estudiante_curso_id
             WHERE da.docente_usuario_id = ?
             AND u.usuario_activo = 1
             ORDER BY u.usuario_apellido ASC`,
            [id]
        );
        res.json(estudiantes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener estudiantes.', error: error.message });
    }
};

// Obtener calificaciones de un curso y asignatura específicos
const obtenerCalificaciones = async (req, res) => {
    const { curso_id, asignatura_id } = req.params;
    try {
        const [estudiantes] = await db.query(
            `SELECT
                e.estudiante_id,
                u.usuario_nombre,
                u.usuario_segundo_nombre,
                u.usuario_apellido,
                u.usuario_segundo_apellido
             FROM estudiantes e
             JOIN usuarios u ON u.usuario_id = e.estudiante_usuario_id
             WHERE e.estudiante_curso_id = ?
             AND u.usuario_activo = 1
             ORDER BY u.usuario_apellido ASC`,
            [curso_id]
        );

        const resultado = await Promise.all(estudiantes.map(async (est) => {
            const [calificaciones] = await db.query(
                `SELECT calificacion_tipo, calificacion_numero, calificacion_nota, calificacion_id
                 FROM calificaciones
                 WHERE calificacion_estudiante_id = ?
                 AND calificacion_asignatura_id = ?`,
                [est.estudiante_id, asignatura_id]
            );
            return { ...est, calificaciones };
        }));

        res.json(resultado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener calificaciones.', error: error.message });
    }
};

// Registrar una nueva calificación
const registrarCalificacion = async (req, res) => {
    const { estudiante_id, asignatura_id, curso_id, tipo, numero, nota } = req.body;
    const profesor_id = req.usuario.id;

    if (nota < 2.0 || nota > 7.0) {
        return res.status(400).json({ mensaje: 'La nota debe estar entre 2.0 y 7.0.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [resultCal] = await conn.query(
            `INSERT INTO calificaciones
       (calificacion_estudiante_id, calificacion_asignatura_id, calificacion_curso_id,
        calificacion_profesor_id, calificacion_tipo, calificacion_numero, calificacion_nota)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [estudiante_id, asignatura_id, curso_id, profesor_id, tipo, numero, nota]
        );

        const calificacionId = resultCal.insertId;

        const [estudiante] = await conn.query(
            `SELECT u.usuario_nombre, u.usuario_segundo_nombre, u.usuario_apellido, u.usuario_segundo_apellido
       FROM estudiantes e JOIN usuarios u ON u.usuario_id = e.estudiante_usuario_id
       WHERE e.estudiante_id = ?`,
            [estudiante_id]
        );
        const [asignatura] = await conn.query(
            'SELECT asignatura_nombre FROM asignaturas WHERE asignatura_id = ?',
            [asignatura_id]
        );

        const nombreEst = `${estudiante[0].usuario_nombre}${estudiante[0].usuario_segundo_nombre ? ' ' + estudiante[0].usuario_segundo_nombre : ''} ${estudiante[0].usuario_apellido}${estudiante[0].usuario_segundo_apellido ? ' ' + estudiante[0].usuario_segundo_apellido : ''}`;
        const detalle = `Registró calificación de ${nombreEst} en ${asignatura[0].asignatura_nombre} - ${tipo} ${numero}|Nota: ${nota}`;

        await conn.query(
            `INSERT INTO historial_cambios
       (historial_usuario_id, historial_registro_id, historial_tabla_afectada, historial_tipo_cambio, historial_detalle_anterior)
       VALUES (?, ?, 'calificaciones', 'INSERT', ?)`,
            [profesor_id, calificacionId, detalle]
        );

        await conn.commit();
        conn.release();
        res.json({ mensaje: 'Calificación registrada correctamente.' });

    } catch (error) {
        await conn.rollback();
        conn.release();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ mensaje: 'Ya existe una calificación de ese tipo y número para este estudiante.' });
        }
        res.status(500).json({ mensaje: 'Error al registrar calificación.', error: error.message });
    }
};

// Modificar una calificación existente
const modificarCalificacion = async (req, res) => {
    const { id } = req.params;
    const { nota } = req.body;
    const profesor_id = req.usuario.id;

    try {
        if (nota < 2.0 || nota > 7.0) {
            return res.status(400).json({ mensaje: 'La nota debe estar entre 2.0 y 7.0.' });
        }

        const [calActual] = await db.query(
            `SELECT c.*, u.usuario_nombre, u.usuario_segundo_nombre, u.usuario_apellido,
                    u.usuario_segundo_apellido, a.asignatura_nombre
             FROM calificaciones c
             JOIN estudiantes e ON e.estudiante_id = c.calificacion_estudiante_id
             JOIN usuarios u ON u.usuario_id = e.estudiante_usuario_id
             JOIN asignaturas a ON a.asignatura_id = c.calificacion_asignatura_id
             WHERE c.calificacion_id = ?`,
            [id]
        );

        if (calActual.length === 0) {
            return res.status(404).json({ mensaje: 'Calificación no encontrada.' });
        }

        const cal = calActual[0];
        const notaAnterior = cal.calificacion_nota;

        await db.query(
            'UPDATE calificaciones SET calificacion_nota = ? WHERE calificacion_id = ?',
            [nota, id]
        );

        const nombreEst = `${cal.usuario_nombre}${cal.usuario_segundo_nombre ? ' ' + cal.usuario_segundo_nombre : ''} ${cal.usuario_apellido}${cal.usuario_segundo_apellido ? ' ' + cal.usuario_segundo_apellido : ''}`;
        const detalle = `Modificó calificación de ${nombreEst} en ${cal.asignatura_nombre} - ${cal.calificacion_tipo} ${cal.calificacion_numero}|Valor anterior: ${notaAnterior} → Nuevo valor: ${nota}`;

        await db.query(
            `INSERT INTO historial_cambios
             (historial_usuario_id, historial_registro_id, historial_tabla_afectada, historial_tipo_cambio, historial_detalle_anterior)
             VALUES (?, ?, 'calificaciones', 'UPDATE', ?)`,
            [profesor_id, id, detalle]
        );

        res.json({ mensaje: 'Calificación modificada correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al modificar calificación.', error: error.message });
    }
};

// Obtener anotaciones del docente
const obtenerAnotaciones = async (req, res) => {
    const { id } = req.params;
    const { tipo } = req.query;

    try {
        let query = `
            SELECT
                an.anotacion_id,
                an.anotacion_tipo,
                an.anotacion_descripcion,
                an.anotacion_fecha,
                u.usuario_nombre,
                u.usuario_segundo_nombre,
                u.usuario_apellido,
                u.usuario_segundo_apellido,
                c.curso_nombre,
                up.usuario_nombre AS profesor_nombre,
                up.usuario_segundo_nombre AS profesor_segundo_nombre,
                up.usuario_apellido AS profesor_apellido,
                up.usuario_segundo_apellido AS profesor_segundo_apellido
            FROM anotaciones an
            JOIN estudiantes e ON e.estudiante_id = an.anotacion_estudiante_id
            JOIN usuarios u ON u.usuario_id = e.estudiante_usuario_id
            JOIN cursos c ON c.curso_id = e.estudiante_curso_id
            JOIN usuarios up ON up.usuario_id = an.anotacion_profesor_id
            WHERE an.anotacion_profesor_id = ?
        `;
        const params = [id];

        if (tipo && tipo !== 'todas') {
            query += ' AND an.anotacion_tipo = ?';
            params.push(tipo);
        }

        query += ' ORDER BY an.anotacion_fecha DESC';

        const [anotaciones] = await db.query(query, params);
        res.json(anotaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener anotaciones.', error: error.message });
    }
};

// Registrar una nueva anotación
const registrarAnotacion = async (req, res) => {
    const { estudiante_id, tipo, descripcion } = req.body;
    const profesor_id = req.usuario.id;

    // Validar que la descripción no esté vacía
    if (!descripcion || !descripcion.trim()) {
        return res.status(400).json({ mensaje: 'La descripción de la anotación es obligatoria.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [resultAnot] = await conn.query(
            `INSERT INTO anotaciones (anotacion_estudiante_id, anotacion_profesor_id, anotacion_tipo, anotacion_descripcion)
       VALUES (?, ?, ?, ?)`,
            [estudiante_id, profesor_id, tipo, descripcion]
        );

        const anotacionId = resultAnot.insertId;

        const [estudiante] = await conn.query(
            `SELECT u.usuario_nombre, u.usuario_segundo_nombre, u.usuario_apellido, u.usuario_segundo_apellido
       FROM estudiantes e JOIN usuarios u ON u.usuario_id = e.estudiante_usuario_id
       WHERE e.estudiante_id = ?`,
            [estudiante_id]
        );

        const nombreEst = `${estudiante[0].usuario_nombre}${estudiante[0].usuario_segundo_nombre ? ' ' + estudiante[0].usuario_segundo_nombre : ''} ${estudiante[0].usuario_apellido}${estudiante[0].usuario_segundo_apellido ? ' ' + estudiante[0].usuario_segundo_apellido : ''}`;
        const detalle = `Registró anotación ${tipo} para ${nombreEst}|${descripcion}`;

        await conn.query(
            `INSERT INTO historial_cambios
       (historial_usuario_id, historial_registro_id, historial_tabla_afectada, historial_tipo_cambio, historial_detalle_anterior)
       VALUES (?, ?, 'anotaciones', 'INSERT', ?)`,
            [profesor_id, anotacionId, detalle]
        );

        await conn.commit();
        conn.release();
        res.json({ mensaje: 'Anotación registrada correctamente.' });

    } catch (error) {
        await conn.rollback();
        conn.release();
        res.status(500).json({ mensaje: 'Error al registrar anotación.', error: error.message });
    }
};

// Obtener resumen para el dashboard del docente
const obtenerResumenDocente = async (req, res) => {
    const { id } = req.params;
    try {
        const [totalEst] = await db.query(
            `SELECT COUNT(DISTINCT e.estudiante_id) AS total
             FROM estudiantes e
             JOIN docente_asignatura da ON da.curso_id = e.estudiante_curso_id
             WHERE da.docente_usuario_id = ?`,
            [id]
        );

        const [totalCal] = await db.query(
            'SELECT COUNT(*) AS total FROM calificaciones WHERE calificacion_profesor_id = ?',
            [id]
        );

        const [totalAnot] = await db.query(
            `SELECT COUNT(*) AS total FROM anotaciones
             WHERE anotacion_profesor_id = ?
             AND MONTH(anotacion_fecha) = MONTH(NOW())
             AND YEAR(anotacion_fecha) = YEAR(NOW())`,
            [id]
        );

        const [promedio] = await db.query(
            `SELECT ROUND(AVG(c.calificacion_nota), 1) AS promedio
             FROM calificaciones c
             WHERE c.calificacion_profesor_id = ?`,
            [id]
        );

        const [actividad] = await db.query(
            `SELECT h.*, u.usuario_nombre, u.usuario_apellido
             FROM historial_cambios h
             JOIN usuarios u ON u.usuario_id = h.historial_usuario_id
             WHERE h.historial_usuario_id = ?
             ORDER BY h.historial_fecha_cambio DESC
             LIMIT 5`,
            [id]
        );

        res.json({
            totalEstudiantes: totalEst[0].total,
            totalCalificaciones: totalCal[0].total,
            totalAnotacionesMes: totalAnot[0].total,
            promedioGeneral: promedio[0].promedio || 0,
            actividadReciente: actividad
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener resumen.', error: error.message });
    }
};

module.exports = {
    obtenerAsignaciones,
    obtenerEstudiantesPorCurso,
    obtenerEstudiantesDelDocente,
    obtenerCalificaciones,
    registrarCalificacion,
    modificarCalificacion,
    obtenerAnotaciones,
    registrarAnotacion,
    obtenerResumenDocente
};