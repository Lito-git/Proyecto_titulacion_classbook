// Importamos las dependencias necesarias
const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { enviarContrasenaTemp } = require('../../config/mailer');

// Función auxiliar para generar una contraseña temporal segura
const generarContrasenaTemp = () => {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
};

// Obtener todos los usuarios con su curso y asignatura según rol
const obtenerUsuarios = async (req, res) => {
    try {
        const [usuarios] = await db.query(
            `SELECT u.usuario_id, u.usuario_nombre, u.usuario_segundo_nombre, u.usuario_apellido,
                    u.usuario_segundo_apellido, u.usuario_email, u.usuario_fecha_registro, u.usuario_activo,
                    u.usuario_rol_id, r.rol_nombre,
                    c_est.curso_nombre AS estudiante_curso,
                    MAX(c_doc.curso_nombre) AS docente_curso,
                    MAX(a.asignatura_nombre) AS docente_asignatura
             FROM usuarios u
             JOIN roles r ON u.usuario_rol_id = r.rol_id
             LEFT JOIN estudiantes e ON e.estudiante_usuario_id = u.usuario_id
             LEFT JOIN cursos c_est ON c_est.curso_id = e.estudiante_curso_id
             LEFT JOIN docente_asignatura da ON da.docente_usuario_id = u.usuario_id
             LEFT JOIN cursos c_doc ON c_doc.curso_id = da.curso_id
             LEFT JOIN asignaturas a ON a.asignatura_id = da.asignatura_id
             GROUP BY u.usuario_id, u.usuario_nombre, u.usuario_segundo_nombre, u.usuario_apellido,
                      u.usuario_segundo_apellido, u.usuario_email, u.usuario_fecha_registro, u.usuario_activo,
                      u.usuario_rol_id, r.rol_nombre, c_est.curso_nombre
             ORDER BY u.usuario_id ASC`
        );
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios.', error: error.message });
    }
};

// Crear un nuevo usuario con transacción para evitar datos huérfanos
const crearUsuario = async (req, res) => {
    const { nombre, segundo_nombre, apellido, segundo_apellido, email, rol_id, rut, fecha_nacimiento, curso_id, asignatura_id } = req.body;

    const conn = await db.getConnection();

    try {
        const [existe] = await conn.query(
            'SELECT usuario_id FROM usuarios WHERE usuario_email = ?',
            [email]
        );

        if (existe.length > 0) {
            conn.release();
            return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
        }

        const contrasenaTemp = generarContrasenaTemp();
        const hash = await bcrypt.hash(contrasenaTemp, 10);

        await conn.beginTransaction();

        const [resultado] = await conn.query(
            `INSERT INTO usuarios (usuario_nombre, usuario_segundo_nombre, usuario_apellido,
                                   usuario_segundo_apellido, usuario_email, usuario_contrasena, usuario_rol_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nombre, segundo_nombre || null, apellido, segundo_apellido || null, email, hash, rol_id]
        );

        const nuevoUsuarioId = resultado.insertId;

        const [roles] = await conn.query('SELECT rol_nombre FROM roles WHERE rol_id = ?', [rol_id]);
        const rolNombre = roles[0].rol_nombre;

        if (rolNombre === 'estudiante') {
            if (!rut || !curso_id) {
                await conn.rollback();
                conn.release();
                return res.status(400).json({ mensaje: 'El RUT y el curso son obligatorios para estudiantes.' });
            }
            await conn.query(
                `INSERT INTO estudiantes (estudiante_usuario_id, estudiante_curso_id, estudiante_rut, estudiante_fecha_nacimiento)
                 VALUES (?, ?, ?, ?)`,
                [nuevoUsuarioId, curso_id, rut, fecha_nacimiento || null]
            );
        }

        if (rolNombre === 'docente') {
            if (!curso_id || !asignatura_id) {
                await conn.rollback();
                conn.release();
                return res.status(400).json({ mensaje: 'El curso y la asignatura son obligatorios para docentes.' });
            }
            await conn.query(
                `INSERT INTO docente_asignatura (docente_usuario_id, asignatura_id, curso_id)
                 VALUES (?, ?, ?)`,
                [nuevoUsuarioId, asignatura_id, curso_id]
            );
        }

        await conn.commit();
        conn.release();

        // Enviamos el correo de forma no bloqueante
        // Si falla el correo, el usuario igual queda creado
        try {
            await enviarContrasenaTemp(email, nombre, contrasenaTemp);
        } catch (mailError) {
            console.error('Error al enviar correo:', mailError.message);
        }

        res.json({ mensaje: `Usuario creado exitosamente. Se envió la contraseña temporal a ${email}.` });

    } catch (error) {
        await conn.rollback();
        conn.release();
        res.status(500).json({ mensaje: 'Error al crear usuario.', error: error.message });
    }
};

// Editar un usuario existente
const editarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, segundo_nombre, apellido, segundo_apellido, email, rol_id } = req.body;

    try {
        await db.query(
            `UPDATE usuarios
             SET usuario_nombre = ?, usuario_segundo_nombre = ?, usuario_apellido = ?,
                 usuario_segundo_apellido = ?, usuario_email = ?, usuario_rol_id = ?
             WHERE usuario_id = ?`,
            [nombre, segundo_nombre || null, apellido, segundo_apellido || null, email, rol_id, id]
        );
        res.json({ mensaje: 'Usuario actualizado correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al editar usuario.', error: error.message });
    }
};

// Resetear contraseña de un usuario en el panel del Administrador
const resetearContrasena = async (req, res) => {
    const { id } = req.params;

    try {
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE usuario_id = ?',
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const usuario = usuarios[0];
        const contrasenaTemp = generarContrasenaTemp();
        const hash = await bcrypt.hash(contrasenaTemp, 10);

        await db.query(
            'UPDATE usuarios SET usuario_contrasena = ? WHERE usuario_id = ?',
            [hash, id]
        );

        // Enviamos el correo de forma no bloqueante
        try {
            await enviarContrasenaTemp(usuario.usuario_email, usuario.usuario_nombre, contrasenaTemp);
        } catch (mailError) {
            console.error('Error al enviar correo:', mailError.message);
        }

        res.json({ mensaje: `Contraseña reseteada. Se envió la nueva contraseña temporal a ${usuario.usuario_email}.` });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al resetear contraseña.', error: error.message });
    }
};

// Obtener todos los roles disponibles
const obtenerRoles = async (req, res) => {
    try {
        const [roles] = await db.query('SELECT * FROM roles ORDER BY rol_id ASC');
        res.json(roles);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener roles.', error: error.message });
    }
};

// Activa o desactiva un usuario (Soft Delete)
const toggleActivoUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const [usuarios] = await db.query(
            'SELECT usuario_activo FROM usuarios WHERE usuario_id = ?',
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const nuevoEstado = usuarios[0].usuario_activo === 1 ? 0 : 1;

        await db.query(
            'UPDATE usuarios SET usuario_activo = ? WHERE usuario_id = ?',
            [nuevoEstado, id]
        );

        const mensaje = nuevoEstado === 1 ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.';
        res.json({ mensaje });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar estado del usuario.', error: error.message });
    }
};

// Eliminar físicamente un usuario y todos sus datos asociados en cascada
const eliminarUsuario = async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();

    try {
        const [usuarios] = await conn.query(
            'SELECT u.*, r.rol_nombre FROM usuarios u JOIN roles r ON r.rol_id = u.usuario_rol_id WHERE u.usuario_id = ?',
            [id]
        );

        if (usuarios.length === 0) {
            conn.release();
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const usuario = usuarios[0];

        if (parseInt(id) === req.usuario.id) {
            conn.release();
            return res.status(400).json({ mensaje: 'No puedes eliminar tu propia cuenta.' });
        }

        await conn.beginTransaction();

        if (usuario.rol_nombre === 'estudiante') {
            const [estudiante] = await conn.query(
                'SELECT estudiante_id FROM estudiantes WHERE estudiante_usuario_id = ?', [id]
            );

            if (estudiante.length > 0) {
                const estudianteId = estudiante[0].estudiante_id;

                await conn.query(
                    `DELETE FROM historial_cambios WHERE historial_registro_id IN (
                        SELECT calificacion_id FROM calificaciones WHERE calificacion_estudiante_id = ?
                    ) AND historial_tabla_afectada = 'calificaciones'`,
                    [estudianteId]
                );

                await conn.query(
                    `DELETE FROM historial_cambios WHERE historial_registro_id IN (
                        SELECT anotacion_id FROM anotaciones WHERE anotacion_estudiante_id = ?
                    ) AND historial_tabla_afectada = 'anotaciones'`,
                    [estudianteId]
                );

                await conn.query(
                    'DELETE FROM calificaciones WHERE calificacion_estudiante_id = ?', [estudianteId]
                );

                await conn.query(
                    'DELETE FROM anotaciones WHERE anotacion_estudiante_id = ?', [estudianteId]
                );

                await conn.query(
                    'DELETE FROM estudiantes WHERE estudiante_id = ?', [estudianteId]
                );
            }
        }

        if (usuario.rol_nombre === 'docente') {
            await conn.query(
                'DELETE FROM historial_cambios WHERE historial_usuario_id = ?', [id]
            );
            await conn.query(
                'DELETE FROM calificaciones WHERE calificacion_profesor_id = ?', [id]
            );
            await conn.query(
                'DELETE FROM anotaciones WHERE anotacion_profesor_id = ?', [id]
            );
            await conn.query(
                'DELETE FROM docente_asignatura WHERE docente_usuario_id = ?', [id]
            );
        }

        await conn.query('DELETE FROM usuarios WHERE usuario_id = ?', [id]);

        await conn.commit();
        conn.release();

        res.json({ mensaje: `Usuario ${usuario.usuario_nombre} ${usuario.usuario_apellido} eliminado correctamente junto con todos sus datos asociados.` });

    } catch (error) {
        await conn.rollback();
        conn.release();
        res.status(500).json({ mensaje: 'Error al eliminar usuario.', error: error.message });
    }
};

module.exports = { obtenerUsuarios, crearUsuario, editarUsuario, resetearContrasena, obtenerRoles, toggleActivoUsuario, eliminarUsuario };