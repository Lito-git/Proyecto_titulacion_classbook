// Importamos las dependencias principales
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importamos la conexión a la base de datos
const db = require('./src/config/db');

// Importamos las rutas
const authRoutes = require('./src/routes/auth.routes');

const usuariosRoutes = require('./src/routes/admin/usuarios.routes');
const cursosRoutes = require('./src/routes/admin/cursos.routes');
const asignaturasRoutes = require('./src/routes/admin/asignaturas.routes');
const historialRoutes = require('./src/routes/admin/historial.routes');

const docenteRoutes = require('./src/routes/docente.routes');

const estudianteRoutes = require('./src/routes/estudiante.routes');

const inspectorRoutes = require('./src/routes/inspector.routes');

// Inicializamos la aplicación Express
const app = express();

// Middlewares globales
app.use(cors());          // Permite peticiones desde el frontend Angular
app.use(express.json());  // Permite leer el body de las peticiones en formato JSON

// Registramos las rutas con sus prefijos
app.use('/auth', authRoutes);

app.use('/usuarios', usuariosRoutes);
app.use('/cursos', cursosRoutes);
app.use('/asignaturas', asignaturasRoutes);
app.use('/historial', historialRoutes);

app.use('/docente', docenteRoutes);

app.use('/estudiante', estudianteRoutes);

app.use('/inspector', inspectorRoutes);

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({ mensaje: 'API ClassBook funcionando correctamente' });
});

// Ruta de prueba para verificar la conexión a la base de datos
app.get('/test-db', async (req, res) => {
  try {
    const [resultado] = await db.query('SELECT 1 + 1 AS resultado');
    res.json({ mensaje: 'Conexión a la base de datos exitosa', resultado: resultado[0].resultado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al conectar con la base de datos', error: error.message });
  }
});

// Ruta para verificar el estado de los servicios del sistema
// Intentamos hacer una consulta simple a la BD para verificar su estado
app.get('/estado', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      baseDatos: 'Operativo',
      backend: 'Operativo',
      autenticacion: 'Operativo'
    });
  } catch (error) {
    res.json({
      baseDatos: 'Sin conexión',
      backend: 'Operativo',
      autenticacion: 'Operativo'
    });
  }
});

// Iniciamos el servidor en el puerto definido en .env
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});