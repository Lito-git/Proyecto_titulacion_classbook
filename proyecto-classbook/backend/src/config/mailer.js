// Importamos nodemailer para el envío de correos
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuramos el transporter de nodemailer con las credenciales de Gmail
// Un transporter es el objeto que gestiona la conexión con el servidor de correo
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER, // Correo Gmail desde el .env
        pass: process.env.MAIL_PASS  // Contraseña de aplicación desde el .env
    }
});

// Función para enviar una contraseña temporal al correo del usuario
// Se usará al crear un nuevo usuario o al resetear su contraseña
const enviarContrasenaTemp = async (destinatario, nombre, contrasenaTemp) => {
    const opcionesCorreo = {
        from: `"ClassBook" <${process.env.MAIL_USER}>`,
        to: destinatario,
        subject: 'Tu contraseña temporal - ClassBook',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #0d2d5e;">Bienvenido/a a ClassBook</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu cuenta ha sido creada exitosamente. Usa la siguiente contraseña temporal para ingresar:</p>
        <div style="background-color: #f0f2f5; padding: 16px; border-radius: 8px; text-align: center;">
          <h3 style="color: #1a73e8; letter-spacing: 2px;">${contrasenaTemp}</h3>
        </div>
        <p>Por seguridad, te recomendamos cambiar tu contraseña al ingresar por primera vez.</p>
        <p>Equipo ClassBook</p>
      </div>
    `
    };

    // Enviamos el correo y retornamos el resultado
    await transporter.sendMail(opcionesCorreo);
};

module.exports = { enviarContrasenaTemp };