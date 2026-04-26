// Importamos jsonwebtoken para verificar los tokens JWT
const jwt = require('jsonwebtoken');

// Middleware de autenticación
// Se ejecuta antes de cada ruta protegida para verificar el token JWT
const verificarToken = (req, res, next) => {

  // Leemos el token del header Authorization de la petición
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <token>"

  // Si no hay token, rechazamos la petición
  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' });
  }

  // Verificamos que el token sea válido y no haya expirado
  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
    }
    // Si el token es válido, guardamos los datos del usuario en req.usuario
    // para que los controladores puedan acceder a ellos
    req.usuario = usuario;
    next(); // Pasamos al siguiente middleware o controlador
  });
};

module.exports = verificarToken;
