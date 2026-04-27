// Importamos las dependencias necesarias
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { enviarContrasenaTemp } = require('../config/mailer');

// Función auxiliar para generar una contraseña temporal aleatoria
const generarContrasenaTemp = () => {
    // Generamos una contraseña de 10 caracteres con letras y números
    return Math.random().toString(36).slice(-10).toUpperCase();
};

// Obtener todos los usuarios con su curso y asignatura según rol
const obtenerUsuarios = async (req, res) => {
    try {
        const [usuarios] = await db.query(
            `SELECT 
        u.usuario_id, u.usuario_nombre, u.usuario_apellido,
        u.usuario_email, u.usuario_fecha_registro, u.usuario_activo,
        u.usuario_rol_id, r.rol_nombre,
        -- Curso del estudiante
        c_est.curso_nombre AS estudiante_curso,
        -- Curso y asignatura del docente
        c_doc.curso_nombre AS docente_curso,
        a.asignatura_nombre AS docente_asignatura
      FROM usuarios u
      JOIN roles r ON u.usuario_rol_id = r.rol_id
      -- JOIN para estudiantes
      LEFT JOIN estudiantes e ON e.estudiante_usuario_id = u.usuario_id
      LEFT JOIN cursos c_est ON c_est.curso_id = e.estudiante_curso_id
      -- JOIN para docentes
      LEFT JOIN docente_asignatura da ON da.docente_usuario_id = u.usuario_id
      LEFT JOIN cursos c_doc ON c_doc.curso_id = da.curso_id
      LEFT JOIN asignaturas a ON a.asignatura_id = da.asignatura_id
      ORDER BY u.usuario_id ASC`
        );
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios.', error: error.message });
    }
};

// Crear un nuevo usuario
// Genera contraseña temporal y la envía por correo
// Si es docente, registra en docente_asignatura
// Si es estudiante, registra en estudiantes
const crearUsuario = async (req, res) => {
    const { nombre, apellido, email, rol_id, rut, fecha_nacimiento, curso_id, asignatura_id } = req.body;

    try {
        // Verificamos que el email no esté registrado
        const [existe] = await db.query(
            'SELECT usuario_id FROM usuarios WHERE usuario_email = ?',
            [email]
        );

        if (existe.length > 0) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
        }

        // Generamos y encriptamos la contraseña temporal
        const contrasenaTemp = generarContrasenaTemp();
        const hash = await bcrypt.hash(contrasenaTemp, 10);

        // Insertamos el nuevo usuario en la BD
        const [resultado] = await db.query(
            `INSERT INTO usuarios (usuario_nombre, usuario_apellido, usuario_email, usuario_contrasena, usuario_rol_id) 
       VALUES (?, ?, ?, ?, ?)`,
            [nombre, apellido, email, hash, rol_id]
        );

        const nuevoUsuarioId = resultado.insertId;

        // Obtenemos el nombre del rol para determinar acciones adicionales
        const [roles] = await db.query('SELECT rol_nombre FROM roles WHERE rol_id = ?', [rol_id]);
        const rolNombre = roles[0].rol_nombre;

        // Si es estudiante, registramos en la tabla estudiantes
        if (rolNombre === 'estudiante') {
            if (!rut || !curso_id) {
                return res.status(400).json({ mensaje: 'El RUT y el curso son obligatorios para estudiantes.' });
            }
            await db.query(
                `INSERT INTO estudiantes (estudiante_usuario_id, estudiante_curso_id, estudiante_rut, estudiante_fecha_nacimiento)
         VALUES (?, ?, ?, ?)`,
                [nuevoUsuarioId, curso_id, rut, fecha_nacimiento || null]
            );
        }

        // Si es docente, registramos en la tabla docente_asignatura
        if (rolNombre === 'docente') {
            if (!curso_id || !asignatura_id) {
                return res.status(400).json({ mensaje: 'El curso y la asignatura son obligatorios para docentes.' });
            }
            await db.query(
                `INSERT INTO docente_asignatura (docente_usuario_id, asignatura_id, curso_id)
         VALUES (?, ?, ?)`,
                [nuevoUsuarioId, asignatura_id, curso_id]
            );
        }

        // Enviamos la contraseña temporal por correo
        await enviarContrasenaTemp(email, nombre, contrasenaTemp);

        res.json({ mensaje: `Usuario creado exitosamente. Se envió la contraseña temporal a ${email}.` });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear usuario.', error: error.message });
    }
};

// Editar un usuario existente
const editarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, rol_id } = req.body;

    try {
        await db.query(
            `UPDATE usuarios 
       SET usuario_nombre = ?, usuario_apellido = ?, usuario_email = ?, usuario_rol_id = ?
       WHERE usuario_id = ?`,
            [nombre, apellido, email, rol_id, id]
        );
        res.json({ mensaje: 'Usuario actualizado correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al editar usuario.', error: error.message });
    }
};

// Resetear contraseña de un usuario (solo administrador)
// Genera una nueva contraseña temporal y la envía por correo
const resetearContrasena = async (req, res) => {
    const { id } = req.params;

    try {
        // Obtenemos los datos del usuario
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE usuario_id = ?',
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const usuario = usuarios[0];

        // Generamos y encriptamos la nueva contraseña temporal
        const contrasenaTemp = generarContrasenaTemp();
        const hash = await bcrypt.hash(contrasenaTemp, 10);

        // Actualizamos la contraseña en la BD
        await db.query(
            'UPDATE usuarios SET usuario_contrasena = ? WHERE usuario_id = ?',
            [hash, id]
        );

        // Enviamos la nueva contraseña temporal por correo
        await enviarContrasenaTemp(usuario.usuario_email, usuario.usuario_nombre, contrasenaTemp);

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

// Activa o desactiva un usuario (soft delete)
const toggleActivoUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        // Obtenemos el estado actual del usuario
        const [usuarios] = await db.query(
            'SELECT usuario_activo FROM usuarios WHERE usuario_id = ?',
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        // Invertimos el estado activo/inactivo
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

module.exports = { obtenerUsuarios, crearUsuario, editarUsuario, resetearContrasena, obtenerRoles, toggleActivoUsuario };