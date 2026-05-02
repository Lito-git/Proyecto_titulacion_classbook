// Importamos la conexión a la base de datos
const db = require('../config/db');

// Obtener resumen del dashboard del inspector
const obtenerResumenInspector = async (req, res) => {
    try {
        // Promedio general del establecimiento
        const [promedio] = await db.query(
            `SELECT ROUND(AVG(calificacion_nota), 1) AS promedio FROM calificaciones`
        );

        // Total anotaciones positivas este mes
        const [anotPositivas] = await db.query(
            `SELECT COUNT(*) AS total FROM anotaciones
       WHERE anotacion_tipo = 'positiva'
       AND MONTH(anotacion_fecha) = MONTH(NOW())
       AND YEAR(anotacion_fecha) = YEAR(NOW())`
        );

        // Total anotaciones negativas este mes
        const [anotNegativas] = await db.query(
            `SELECT COUNT(*) AS total FROM anotaciones
       WHERE anotacion_tipo = 'negativa'
       AND MONTH(anotacion_fecha) = MONTH(NOW())
       AND YEAR(anotacion_fecha) = YEAR(NOW())`
        );

        // Casos que requieren seguimiento: estudiantes con 3 o más anotaciones negativas este mes
        const [casosSeguimiento] = await db.query(
            `SELECT COUNT(*) AS total FROM (
        SELECT anotacion_estudiante_id
        FROM anotaciones
        WHERE anotacion_tipo = 'negativa'
        AND MONTH(anotacion_fecha) = MONTH(NOW())
        AND YEAR(anotacion_fecha) = YEAR(NOW())
        GROUP BY anotacion_estudiante_id
        HAVING COUNT(*) >= 3
       ) AS casos`
        );

        // Rendimiento por curso
        const [cursos] = await db.query(
            `SELECT 
        c.curso_id,
        c.curso_nombre,
        COUNT(DISTINCT e.estudiante_id) AS total_estudiantes,
        COUNT(DISTINCT CASE WHEN an.anotacion_tipo = 'positiva' THEN an.anotacion_id END) AS anotaciones_positivas,
        COUNT(DISTINCT CASE WHEN an.anotacion_tipo = 'negativa' THEN an.anotacion_id END) AS anotaciones_negativas,
        ROUND(AVG(cal.calificacion_nota), 1) AS promedio
       FROM cursos c
       LEFT JOIN estudiantes e ON e.estudiante_curso_id = c.curso_id
       LEFT JOIN anotaciones an ON an.anotacion_estudiante_id = e.estudiante_id
       LEFT JOIN calificaciones cal ON cal.calificacion_estudiante_id = e.estudiante_id
       GROUP BY c.curso_id
       ORDER BY c.curso_nombre ASC`
        );

        // Alertas recientes: estudiantes con muchas anotaciones negativas
        const [alertasNegativas] = await db.query(
            `SELECT 
        u.usuario_nombre,
        u.usuario_segundo_nombre,
        u.usuario_apellido,
        u.usuario_segundo_apellido,
        c.curso_nombre,
        COUNT(*) AS total_negativas,
        MAX(an.anotacion_fecha) AS ultima_fecha
       FROM anotaciones an
       JOIN estudiantes e ON e.estudiante_id = an.anotacion_estudiante_id
       JOIN usuarios u ON u.usuario_id = e.estudiante_usuario_id
       JOIN cursos c ON c.curso_id = e.estudiante_curso_id
       WHERE an.anotacion_tipo = 'negativa'
       AND an.anotacion_fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY e.estudiante_id
       HAVING COUNT(*) >= 2
       ORDER BY total_negativas DESC
       LIMIT 5`
        );

        // Alertas de rendimiento bajo por curso y asignatura
        const [alertasRendimiento] = await db.query(
            `SELECT 
        c.curso_nombre,
        a.asignatura_nombre,
        ROUND(AVG(cal.calificacion_nota), 1) AS promedio,
        MAX(cal.calificacion_fecha_registro) AS ultima_fecha
       FROM calificaciones cal
       JOIN cursos c ON c.curso_id = cal.calificacion_curso_id
       JOIN asignaturas a ON a.asignatura_id = cal.calificacion_asignatura_id
       GROUP BY cal.calificacion_curso_id, cal.calificacion_asignatura_id
       HAVING promedio < 5.0
       ORDER BY promedio ASC
       LIMIT 3`
        );

        res.json({
            promedioGeneral: promedio[0].promedio || 0,
            anotacionesPositivasMes: anotPositivas[0].total,
            anotacionesNegativasMes: anotNegativas[0].total,
            casosSeguimiento: casosSeguimiento[0].total,
            cursos,
            alertasNegativas,
            alertasRendimiento
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener resumen.', error: error.message });
    }
};

// Obtener reportes de rendimiento con filtros
const obtenerReportes = async (req, res) => {
    const { curso_id, asignatura_id, busqueda, estudiante_id } = req.query;

    try {

        // Promedio general — ahora respeta los filtros activos
        let queryPromedio = `SELECT ROUND(AVG(calificacion_nota), 1) AS promedio FROM calificaciones WHERE 1=1`;
        const paramsPromedio = [];
        if (curso_id) { queryPromedio += ' AND calificacion_curso_id = ?'; paramsPromedio.push(curso_id); }
        if (asignatura_id) { queryPromedio += ' AND calificacion_asignatura_id = ?'; paramsPromedio.push(asignatura_id); }
        if (estudiante_id) { queryPromedio += ' AND calificacion_estudiante_id = ?'; paramsPromedio.push(estudiante_id); }
        const [promedioGeneral] = await db.query(queryPromedio, paramsPromedio);

        // Si hay asignatura seleccionada pero no curso → mostrar promedio por CURSO de esa asignatura
        // Si hay curso seleccionado → mostrar promedio por ASIGNATURA de ese curso
        // Si no hay ninguno → mostrar promedio por ASIGNATURA de todo el establecimiento
        let queryAsignaturas;
        const paramsAsig = [];

        if (asignatura_id && !curso_id) {
            // Todos los cursos + asignatura específica → agrupa por curso
            queryAsignaturas = `
        SELECT 
            c.curso_id AS asignatura_id,
            c.curso_nombre AS asignatura_nombre,
            ROUND(AVG(cal.calificacion_nota), 1) AS promedio
        FROM calificaciones cal
        JOIN cursos c ON c.curso_id = cal.calificacion_curso_id
        WHERE cal.calificacion_asignatura_id = ?
        GROUP BY c.curso_id
        ORDER BY c.curso_nombre ASC
    `;
            paramsAsig.push(asignatura_id);
        } else {
            // Todos los demás casos → agrupa por asignatura
            queryAsignaturas = `
        SELECT 
            a.asignatura_id,
            a.asignatura_nombre,
            ROUND(AVG(cal.calificacion_nota), 1) AS promedio
        FROM calificaciones cal
        JOIN asignaturas a ON a.asignatura_id = cal.calificacion_asignatura_id
        WHERE 1=1
    `;
            if (curso_id) { queryAsignaturas += ' AND cal.calificacion_curso_id = ?'; paramsAsig.push(curso_id); }
            if (asignatura_id) { queryAsignaturas += ' AND cal.calificacion_asignatura_id = ?'; paramsAsig.push(asignatura_id); }
            queryAsignaturas += ' GROUP BY a.asignatura_id ORDER BY a.asignatura_nombre ASC';
        }

        const [promediosPorAsignatura] = await db.query(queryAsignaturas, paramsAsig);

        // Búsqueda de estudiantes
        let estudiantes = [];
        if (busqueda && busqueda.trim().length >= 2) {
            let queryEst = `
        SELECT 
          u.usuario_id,
          u.usuario_nombre,
          u.usuario_segundo_nombre,
          u.usuario_apellido,
          u.usuario_segundo_apellido,
          c.curso_nombre,
          e.estudiante_id
        FROM usuarios u
        JOIN estudiantes e ON e.estudiante_usuario_id = u.usuario_id
        JOIN cursos c ON c.curso_id = e.estudiante_curso_id
        WHERE u.usuario_activo = 1
      `;
            const paramsEst = [];
            if (curso_id) { queryEst += ' AND e.estudiante_curso_id = ?'; paramsEst.push(curso_id); }
            queryEst += ` AND CONCAT(u.usuario_nombre, ' ', IFNULL(u.usuario_segundo_nombre,''), ' ', u.usuario_apellido, ' ', IFNULL(u.usuario_segundo_apellido,'')) LIKE ?`;
            paramsEst.push(`%${busqueda}%`);
            const [result] = await db.query(queryEst, paramsEst);
            estudiantes = result;
        }

        // Notas del estudiante seleccionado — ahora también filtra por asignatura_id
        let notasEstudiante = [];
        if (estudiante_id) {
            let queryNotas = `
        SELECT 
          a.asignatura_nombre,
          ROUND(AVG(cal.calificacion_nota), 1) AS promedio
        FROM calificaciones cal
        JOIN asignaturas a ON a.asignatura_id = cal.calificacion_asignatura_id
        WHERE cal.calificacion_estudiante_id = ?
      `;
            const paramsNotas = [estudiante_id];
            if (asignatura_id) { queryNotas += ' AND cal.calificacion_asignatura_id = ?'; paramsNotas.push(asignatura_id); }
            queryNotas += ' GROUP BY a.asignatura_id ORDER BY a.asignatura_nombre ASC';
            const [notas] = await db.query(queryNotas, paramsNotas);
            notasEstudiante = notas;
        }

        res.json({
            promedioGeneral: promedioGeneral[0].promedio || 0,
            promediosPorAsignatura,
            estudiantes,
            notasEstudiante
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener reportes.', error: error.message });
    }
};

// Obtener anotaciones del establecimiento con filtros
const obtenerAnotaciones = async (req, res) => {
    const { tipo, curso_id, busqueda, fecha_inicio, fecha_fin } = req.query;

    try {
        // Totales de anotaciones positivas y negativas
        const [totales] = await db.query(
            `SELECT 
        COUNT(CASE WHEN anotacion_tipo = 'positiva' THEN 1 END) AS total_positivas,
        COUNT(CASE WHEN anotacion_tipo = 'negativa' THEN 1 END) AS total_negativas
       FROM anotaciones`
        );

        // Query principal de anotaciones con filtros
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
        up.usuario_segundo_apellido AS profesor_segundo_apellido,
        a.asignatura_nombre
       FROM anotaciones an
       JOIN estudiantes e ON e.estudiante_id = an.anotacion_estudiante_id
       JOIN usuarios u ON u.usuario_id = e.estudiante_usuario_id
       JOIN cursos c ON c.curso_id = e.estudiante_curso_id
       JOIN usuarios up ON up.usuario_id = an.anotacion_profesor_id
       LEFT JOIN docente_asignatura da ON da.docente_usuario_id = an.anotacion_profesor_id
       LEFT JOIN asignaturas a ON a.asignatura_id = da.asignatura_id
       WHERE 1=1
    `;
        const params = [];

        if (tipo && tipo !== 'todas') { query += ' AND an.anotacion_tipo = ?'; params.push(tipo); }
        if (curso_id) { query += ' AND e.estudiante_curso_id = ?'; params.push(curso_id); }
        if (fecha_inicio) { query += ' AND DATE(an.anotacion_fecha) >= ?'; params.push(fecha_inicio); }
        if (fecha_fin) { query += ' AND DATE(an.anotacion_fecha) <= ?'; params.push(fecha_fin); }
        if (busqueda && busqueda.trim().length >= 2) {
            query += ` AND CONCAT(u.usuario_nombre, ' ', IFNULL(u.usuario_segundo_nombre,''), ' ', u.usuario_apellido, ' ', IFNULL(u.usuario_segundo_apellido,'')) LIKE ?`;
            params.push(`%${busqueda}%`);
        }

        query += ' ORDER BY an.anotacion_fecha DESC';

        const [anotaciones] = await db.query(query, params);

        res.json({
            totalPositivas: totales[0].total_positivas,
            totalNegativas: totales[0].total_negativas,
            anotaciones
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener anotaciones.', error: error.message });
    }
};

// Obtener todos los cursos para los filtros
const obtenerCursos = async (req, res) => {
    try {
        const [cursos] = await db.query('SELECT curso_id, curso_nombre FROM cursos ORDER BY curso_nombre ASC');
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener cursos.', error: error.message });
    }
};

// Obtener todas las asignaturas para los filtros
const obtenerAsignaturas = async (req, res) => {
    try {
        const [asignaturas] = await db.query('SELECT asignatura_id, asignatura_nombre FROM asignaturas ORDER BY asignatura_nombre ASC');
        res.json(asignaturas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener asignaturas.', error: error.message });
    }
};

module.exports = { obtenerResumenInspector, obtenerReportes, obtenerAnotaciones, obtenerCursos, obtenerAsignaturas };