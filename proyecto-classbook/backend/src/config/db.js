// Importamos mysql2 y dotenv para leer las variables de entorno
const mysql = require('mysql2');
require('dotenv').config();

// Creamos un pool de conexiones a la base de datos
// En pool reutilizará conexiones existentes en vez de abrir una nueva y esto mejora el rendimiento y evita saturar el servidor de la DB
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Exportamos el pool con soporte para promesas para poder usar async/await en los controladores
module.exports = pool.promise();