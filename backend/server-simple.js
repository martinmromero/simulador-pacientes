require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Almacenamiento en memoria (temporal, sin base de datos)
const casosClinicos = require('./data/casos-memoria');
const sesionesMemoria = new Map();
const mensajesMemoria = new Map();

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto-temporal-cambiar',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Middleware para identificar usuarios
app.use((req, res, next) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4();
  }
  next();
});

// ========== RUTAS ==========

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'memoria'
  });
});

// Obtener casos clínicos
app.get('/api/casos', (req, res) => {
  res.json(casosClinicos);
});

// Obtener caso específico
app.get('/api/casos/:id', (req, res) => {
  const caso = casosClinicos.find(c => c.id == req.params.id);
  if (!caso) {
    return res.status(404).json({ error: 'Caso no encontrado' });
  }
  res.json(caso);
});

// Crear nueva sesión
app.post('/api/sesiones/nueva', (req, res) => {
  const { caso_id, estudiante_id, estudiante_nombre } = req.body;
  const session_id = uuidv4();
  
  const sesion = {
    id: session_id,
    caso_id,
    estudiante_id: estudiante_id || req.session.userId,
    estudiante_nombre: estudiante_nombre || 'Estudiante',
    inicio: new Date(),
    mensajes: []
  };
  
  sesionesMemoria.set(session_id, sesion);
  mensajesMemoria.set(session_id, []);
  
  res.status(201).json({
    session_id,
    caso_id,
    inicio: sesion.inicio
  });
});

// Obtener mensajes de sesión
app.get('/api/sesiones/:session_id/mensajes', (req, res) => {
  const mensajes = mensajesMemoria.get(req.params.session_id) || [];
  res.json(mensajes);
});

// Guardar mensaje
app.post('/api/sesiones/:session_id/mensajes', (req, res) => {
  const { session_id } = req.params;
  const { rol, contenido, audio_usado, metadata } = req.body;
  
  const mensaje = {
    id: uuidv4(),
    session_id,
    rol,
    contenido,
    timestamp: new Date(),
    audio_usado: audio_usado || false,
    metadata: metadata || {}
  };
  
  const mensajes = mensajesMemoria.get(session_id) || [];
  mensajes.push(mensaje);
  mensajesMemoria.set(session_id, mensajes);
  
  res.status(201).json(mensaje);
});

// Generar respuesta IA
app.post('/api/ia/generar-respuesta', (req, res) => {
  const { session_id, pregunta_estudiante, caso_id } = req.body;
  
  // Respuestas simuladas
  const respuestasSimuladas = [
    "No sé… me cuesta hablar de eso.",
    "Puede ser, pero no creo que sea tan grave.",
    "No lo había pensado así.",
    "Prefiero no hablar de ese tema ahora.",
    "No sé por qué me pongo así cuando me preguntan eso.",
    "Supongo que siempre fui un poco nerviosa.",
    "No creo que tenga que ver con mi trabajo… aunque no sé.",
    "Mmm... (pausa) ¿por qué me pregunta eso?",
    "Últimamente todo me cuesta más.",
    "No es algo que me guste recordar."
  ];
  
  const detectarEmocion = (pregunta) => {
    const texto = pregunta.toLowerCase();
    if (texto.includes('familia') || texto.includes('infancia')) {
      return ['incomodidad', 'evasión'];
    }
    if (texto.includes('trabajo')) {
      return ['tensión', 'defensividad'];
    }
    if (texto.includes('siente') || texto.includes('emociones')) {
      return ['reflexión', 'vulnerabilidad'];
    }
    return ['neutral'];
  };
  
  const respuesta = {
    texto: respuestasSimuladas[Math.floor(Math.random() * respuestasSimuladas.length)],
    confianza: 0.85,
    emociones: detectarEmocion(pregunta_estudiante),
    metadata: {
      modo: 'simulado',
      modelo: 'pendiente'
    }
  };
  
  res.json(respuesta);
});

// Finalizar sesión
app.put('/api/sesiones/:session_id/finalizar', (req, res) => {
  const { session_id } = req.params;
  const { notas_estudiante, autoevaluacion } = req.body;
  
  const sesion = sesionesMemoria.get(session_id);
  if (!sesion) {
    return res.status(404).json({ error: 'Sesión no encontrada' });
  }
  
  sesion.fin = new Date();
  sesion.notas_estudiante = notas_estudiante;
  sesion.autoevaluacion = autoevaluacion;
  
  res.json(sesion);
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 Simulador de Pacientes - Backend corriendo en puerto ${PORT}`);
  console.log(`📊 Modo: MEMORIA (sin base de datos)`);
  console.log(`🌐 Acceder desde: http://0.0.0.0:${PORT}`);
  console.log(`✅ Casos clínicos cargados: ${casosClinicos.length}`);
});

module.exports = app;
