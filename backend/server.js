require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Importar módulos
const db = require('./database');
const casosClinicosRoutes = require('./routes/casosClinicos');
const sesionesRoutes = require('./routes/sesiones');
const iaRoutes = require('./routes/ia');

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://tu-dominio-universidad.edu' 
    : 'http://localhost:8080',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de sesiones para soporte multi-usuario
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto-temporal-cambiar',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware para identificar usuarios
app.use((req, res, next) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4();
  }
  next();
});

// Rutas
app.use('/api/casos', casosClinicosRoutes);
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/ia', iaRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    users_online: Object.keys(activeSessions).length
  });
});

// Manejo de sesiones activas (para monitoreo)
const activeSessions = {};

app.get('/api/stats', (req, res) => {
  res.json({
    active_sessions: Object.keys(activeSessions).length,
    total_cases: 0, // Se llenará con DB
    uptime: process.uptime()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🏥 Simulador de Pacientes - Backend corriendo en puerto ${PORT}`);
  console.log(`📊 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Base de datos: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
});

// Exportar para tests
module.exports = app;
