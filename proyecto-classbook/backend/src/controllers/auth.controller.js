// Importamos las dependencias necesarias
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { enviarContrasenaTemp, notificarCambioContrasena } = require('../config/mailer');

// Controlador de login
// Valida las credenciales del usuario y retorna un token JWT si son correctas
const login = async (req, res) => {
    const { email, contrasena } = req.body;

    try {
        // Buscamos el usuario por email junto con el nombre de su rol y asignatura si es docente
        const [usuarios] = await db.query(
            `SELECT u.*, r.rol_nombre, a.asignatura_nombre
             FROM usuarios u
             JOIN roles r ON u.usuario_rol_id = r.rol_id
             LEFT JOIN docente_asignatura da ON da.docente_usuario_id = u.usuario_id
             LEFT JOIN asignaturas a ON a.asignatura_id = da.asignatura_id
             WHERE u.usuario_email = ?`,
            [email]
        );

        // Si no existe el usuario retornamos error
        if (usuarios.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
        }

        const usuario = usuarios[0];

        // Verificamos que el usuario esté activo
        if (usuario.usuario_activo === 0) {
            return res.status(401).json({ mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
        }

        // Comparamos la contraseña ingresada con el hash guardado en la BD
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.usuario_contrasena);
        if (!contrasenaValida) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
        }

        // Generamos el token JWT con los datos del usuario
        // El token expira en 8 horas (duración de una jornada académica)
        const token = jwt.sign(
            {
                id: usuario.usuario_id,
                email: usuario.usuario_email,
                rol: usuario.rol_nombre
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Retornamos el token y los datos básicos del usuario
        res.json({
            token,
            rol: usuario.rol_nombre,
            nombre: usuario.usuario_nombre,
            apellido: usuario.usuario_apellido,
            asignatura: usuario.asignatura_nombre || ''
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor.', error: error.message });
    }
};

// Controlador de cambio de contraseña
// Permite al usuario cambiar su contraseña ingresando la actual y la nueva
const cambiarContrasena = async (req, res) => {
    const { contrasenaActual, contrasenaNueva } = req.body;
    const usuarioId = req.usuario.id;

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

        // Enviamos notificación por correo al usuario
        await notificarCambioContrasena(usuario.usuario_email, usuario.usuario_nombre);

        res.json({ mensaje: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor.', error: error.message });
    }
};

// Controlador de recuperación de contraseña
// Genera una nueva contraseña temporal y la envía al correo del usuario
const recuperarContrasena = async (req, res) => {
    const { email } = req.body;

    try {
        // Verificamos que el email esté registrado en la BD
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE usuario_email = ?',
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'No existe una cuenta asociada a ese correo.' });
        }

        const usuario = usuarios[0];

        // Verificamos que el usuario esté activo
        if (usuario.usuario_activo === 0) {
            return res.status(401).json({ mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
        }

        // Generamos una contraseña temporal aleatoria
        const contrasenaTemp = Math.random().toString(36).slice(-10).toUpperCase();

        // Encriptamos la contraseña temporal
        const hash = await bcrypt.hash(contrasenaTemp, 10);

        // Actualizamos la contraseña en la BD
        await db.query(
            'UPDATE usuarios SET usuario_contrasena = ? WHERE usuario_id = ?',
            [hash, usuario.usuario_id]
        );

        // Enviamos la nueva contraseña temporal por correo
        await enviarContrasenaTemp(email, usuario.usuario_nombre, contrasenaTemp, true);

        res.json({ mensaje: 'Se envió una nueva contraseña temporal a tu correo.' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor.', error: error.message });
    }
};

module.exports = { login, cambiarContrasena, recuperarContrasena };