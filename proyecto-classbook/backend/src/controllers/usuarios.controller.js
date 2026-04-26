// Importamos las dependencias necesarias
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { enviarContrasenaTemp } = require('../config/mailer');

// Función auxiliar para generar una contraseña temporal aleatoria
const generarContrasenaTemp = () => {
    // Generamos una contraseña de 10 caracteres con letras y números
    return Math.random().toString(36).slice(-10).toUpperCase();
};

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
    try {
        const [usuarios] = await db.query(
            `SELECT u.usuario_id, u.usuario_nombre, u.usuario_apellido, 
              u.usuario_email, u.usuario_fecha_registro, r.rol_nombre
       FROM usuarios u
       JOIN roles r ON u.usuario_rol_id = r.rol_id
       ORDER BY u.usuario_id ASC`
        );
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios.', error: error.message });
    }
};

// Crear un nuevo usuario
// Genera contraseña temporal y la envía por correo
const crearUsuario = async (req, res) => {
    const { nombre, apellido, email, rol_id } = req.body;

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
        await db.query(
            `INSERT INTO usuarios (usuario_nombre, usuario_apellido, usuario_email, usuario_contrasena, usuario_rol_id) 
       VALUES (?, ?, ?, ?, ?)`,
            [nombre, apellido, email, hash, rol_id]
        );

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

module.exports = { obtenerUsuarios, crearUsuario, editarUsuario, resetearContrasena, obtenerRoles };