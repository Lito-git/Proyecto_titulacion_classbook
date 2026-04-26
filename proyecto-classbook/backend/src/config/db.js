// Importamos mysql2 y dotenv para leer las variables de entorno
const mysql = require('mysql2');
require('dotenv').config();

// Creamos un pool de conexiones a la base de datos
// Un pool reutiliza conexiones existentes en lugar de abrir una nueva
// Esto mejora el rendimiento y evita saturar el servidor de  la DB
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Exportamos el pool con soporte para promesas
// Esto es para usar async/await en los controladores
module.exports = pool.promise();