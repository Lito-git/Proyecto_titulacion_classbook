// Importamos las dependencias necesarias
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { enviarContrasenaTemp, notificarCambioContrasena } = require('../config/mailer');

// Controlador de login
const login = async (req, res) => {
    const { email, contrasena } = req.body;

    try {
        // Buscamos el usuario por email — LIMIT 1 para evitar duplicados si el docente
        // tiene múltiples asignaciones (el JOIN con docente_asignatura puede retornar N filas)
        const [usuarios] = await db.query(
            `SELECT u.usuario_id, u.usuario_nombre, u.usuario_segundo_nombre, u.usuario_apellido,
                    u.usuario_segundo_apellido, u.usuario_email, u.usuario_contrasena,
                    u.usuario_activo, r.rol_nombre, c.curso_nombre
             FROM usuarios u
             JOIN roles r ON u.usuario_rol_id = r.rol_id
             LEFT JOIN estudiantes e ON e.estudiante_usuario_id = u.usuario_id
             LEFT JOIN cursos c ON c.curso_id = e.estudiante_curso_id
             WHERE u.usuario_email = ?
             LIMIT 1`,
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ mensaje: 'El usuario o contraseña son incorrectos.' });
        }

        const usuario = usuarios[0];

        if (usuario.usuario_activo === 0) {
            return res.status(401).json({ mensaje: 'Tu cuenta ha sido desactivada. Pongase en contacto con soporte.' });
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.usuario_contrasena);
        if (!contrasenaValida) {
            return res.status(401).json({ mensaje: 'El usuario o contraseña son incorrectos.' });
        }

        // Si es docente, buscamos su asignatura principal por separado
        let asignaturaNombre = '';
        if (usuario.rol_nombre === 'docente') {
            const [asignaciones] = await db.query(
                `SELECT a.asignatura_nombre
                 FROM docente_asignatura da
                 JOIN asignaturas a ON a.asignatura_id = da.asignatura_id
                 WHERE da.docente_usuario_id = ?
                 LIMIT 1`,
                [usuario.usuario_id]
            );
            if (asignaciones.length > 0) {
                asignaturaNombre = asignaciones[0].asignatura_nombre;
            }
        }

        const token = jwt.sign(
            { id: usuario.usuario_id, email: usuario.usuario_email, rol: usuario.rol_nombre },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            rol: usuario.rol_nombre,
            nombre: usuario.usuario_nombre,
            segundo_nombre: usuario.usuario_segundo_nombre || '',
            apellido: usuario.usuario_apellido,
            segundo_apellido: usuario.usuario_segundo_apellido || '',
            asignatura: asignaturaNombre,
            curso: usuario.curso_nombre || ''
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor.', error: error.message });
    }
};

// Controlador de cambio de contraseña
const cambiarContrasena = async (req, res) => {
    const { contrasenaActual, contrasenaNueva } = req.body;
    const usuarioId = req.usuario.id;

    // Validar que los campos no estén vacíos
    if (!contrasenaActual || !contrasenaActual.trim() || !contrasenaNueva || !contrasenaNueva.trim()) {
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }

    try {
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE usuario_id = ?',
            [usuarioId]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const usuario = usuarios[0];

        const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.usuario_contrasena);
        if (!contrasenaValida) {
            return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta.' });
        }

        const hashNueva = await bcrypt.hash(contrasenaNueva, 10);

        await db.query(
            'UPDATE usuarios SET usuario_contrasena = ? WHERE usuario_id = ?',
            [hashNueva, usuarioId]
        );

        await notificarCambioContrasena(usuario.usuario_email, usuario.usuario_nombre);

        res.json({ mensaje: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor.', error: error.message });
    }
};

// Controlador de recuperación de contraseña
// Usa crypto para generar contraseña temporal segura
const recuperarContrasena = async (req, res) => {
    const { email } = req.body;

    // Validar que el email no esté vacío
    if (!email || !email.trim()) {
        return res.status(400).json({ mensaje: 'El correo electrónico es obligatorio.' });
    }

    try {
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE usuario_email = ?',
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'No existe una cuenta asociada a ese correo.' });
        }

        const usuario = usuarios[0];

        if (usuario.usuario_activo === 0) {
            return res.status(401).json({ mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
        }

        // Contraseña temporal criptográficamente segura (12 chars hex)
        const contrasenaTemp = crypto.randomBytes(6).toString('hex').toUpperCase();

        const hash = await bcrypt.hash(contrasenaTemp, 10);

        await db.query(
            'UPDATE usuarios SET usuario_contrasena = ? WHERE usuario_id = ?',
            [hash, usuario.usuario_id]
        );

        await enviarContrasenaTemp(email, usuario.usuario_nombre, contrasenaTemp, true);

        res.json({ mensaje: 'Se envió una nueva contraseña temporal a tu correo.' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor.', error: error.message });
    }
};

module.exports = { login, cambiarContrasena, recuperarContrasena };