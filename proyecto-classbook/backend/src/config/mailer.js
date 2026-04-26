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
const enviarContrasenaTemp = async (destinatario, nombre, contrasenaTemp, esRecuperacion = false) => {
    const mensajeCuerpo = esRecuperacion
        ? 'Recibimos una solicitud para restablecer tu contraseña. Tu nueva contraseña temporal es:'
        : 'Tu cuenta en ClassBook está lista. Tu usuario es tu correo electrónico y tu contraseña temporal es:';

    const opcionesCorreo = {
        from: `"ClassBook" <${process.env.MAIL_USER}>`,
        to: destinatario,
        subject: esRecuperacion ? 'Restablecimiento de contraseña - ClassBook' : 'Tu contraseña temporal - ClassBook',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #1a3f7a; padding: 24px; text-align: center;">
          <img src="https://raw.githubusercontent.com/Lito-git/Proyecto_titulacion_classbook/main/proyecto-classbook/public/classbook_logo.png" 
               alt="ClassBook" style="width: 60px; margin-bottom: 8px;" />
          <h1 style="color: #eaf1ff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">ClassBook</h1>
          <p style="color: #b8c7e6; margin: 4px 0 0 0; font-size: 13px;">Sistema de Gestión Académica</p>
        </div>
        <!-- Cuerpo -->
        <div style="padding: 32px;">
          <p style="color: #333; font-size: 15px;">Hola <strong>${nombre}</strong>,</p>
          <p style="color: #555; font-size: 14px;">${mensajeCuerpo}</p>
          <!-- Contraseña temporal -->
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background-color: #f0f2f5; border-radius: 8px; padding: 16px 32px;">
              <span style="color: #1a73e8; font-size: 15px; font-weight: bold; letter-spacing: 4px;">${contrasenaTemp}</span>
            </div>
          </div>
        </div>
        <!-- Footer -->
        <div style="background-color: #f0f2f5; padding: 16px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">Este correo fue enviado automáticamente por ClassBook. Por favor no respondas este mensaje.</p>
        </div>
      </div>
    `
    };

    await transporter.sendMail(opcionesCorreo);
};

module.exports = { enviarContrasenaTemp };

