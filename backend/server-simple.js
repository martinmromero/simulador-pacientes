require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Ollama (dinámica)
let OLLAMA_CONFIG = {
  HOST: process.env.OLLAMA_HOST || '192.168.12.236',
  PORT: process.env.OLLAMA_PORT || '11434',
  MODEL: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
  MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS) || 150,
  TOP_P: parseFloat(process.env.AI_TOP_P) || 0.9
};

function getOllamaURL() {
  return `http://${OLLAMA_CONFIG.HOST}:${OLLAMA_CONFIG.PORT}/api/generate`;
}

function getOllamaTagsURL() {
  return `http://${OLLAMA_CONFIG.HOST}:${OLLAMA_CONFIG.PORT}/api/tags`;
}

console.log(`[IA] Configurado para usar Ollama en ${OLLAMA_CONFIG.HOST}:${OLLAMA_CONFIG.PORT} con modelo ${OLLAMA_CONFIG.MODEL}`);

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

// Generar respuesta IA con Ollama
app.post('/api/ia/generar-respuesta', async (req, res) => {
  const { session_id, pregunta_estudiante, caso_id } = req.body;
  
  try {
    // Obtener información del caso
    const caso = casosClinicos.find(c => c.id === parseInt(caso_id));
    if (!caso) {
      return res.status(404).json({ error: 'Caso clínico no encontrado' });
    }
    
    // Obtener historial de mensajes
    const mensajes = mensajesMemoria.get(session_id) || [];
    const historial = mensajes.slice(-6).map(m => 
      `${m.rol === 'estudiante' ? 'Terapeuta' : 'Paciente'}: ${m.contenido}`
    ).join('\n');
    
    // Construir el prompt para Ollama
    const prompt = `${caso.contexto_sistema}

INFORMACIÓN DEL PACIENTE:
- Nombre: ${caso.nombre}
- Edad: ${caso.edad}
- Ocupación: ${caso.ocupacion}
- Motivo de consulta: ${caso.motivo_consulta}
- Historia: ${caso.historia}
- Estado emocional: ${caso.estado_emocional}
- Personalidad: ${caso.personalidad}

${historial ? `CONVERSACIÓN PREVIA:\n${historial}\n` : ''}
Terapeuta: ${pregunta_estudiante}
Paciente:`;

    // Llamar a Ollama
    const startTime = Date.now();
    const ollamaResponse = await axios.post(getOllamaURL(), {
      model: OLLAMA_CONFIG.MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: OLLAMA_CONFIG.TEMPERATURE,
        num_predict: OLLAMA_CONFIG.MAX_TOKENS,
        top_p: OLLAMA_CONFIG.TOP_P,
        stop: ["\nTerapeuta:", "\nEstudiante:", "\n\n"]
      }
    }, {
      timeout: 30000
    });
    
    const endTime = Date.now();
    const textoRespuesta = ollamaResponse.data.response.trim();
    
    // Detectar emoción basada en el contenido
    const detectarEmocion = (texto) => {
      const lower = texto.toLowerCase();
      if (lower.includes('no sé') || lower.includes('no estoy segur')) return ['incomodidad'];
      if (lower.includes('...') || lower.includes('mmm')) return ['reflexión'];
      if (lower.includes('no quiero') || lower.includes('prefiero no')) return ['evasión'];
      if (lower.includes('me pone') || lower.includes('me molesta')) return ['tensión'];
      return ['neutral'];
    };
    
    const respuesta = {
      texto: textoRespuesta,
      confianza: 0.92,
      emociones: detectarEmocion(textoRespuesta),
      metadata: {
        modo: 'ollama',
        modelo: OLLAMA_CONFIG.MODEL,
        tokens: ollamaResponse.data.eval_count || 0,
        tiempo_ms: endTime - startTime,
        servidor: `${OLLAMA_CONFIG.HOST}:${OLLAMA_CONFIG.PORT}`
      }
    };
    
    console.log(`[IA] Session: ${session_id} | Modelo: ${OLLAMA_CONFIG.MODEL} | Tiempo: ${endTime - startTime}ms`);
    
    res.json(respuesta);
    
  } catch (error) {
    console.error('[IA] Error generando respuesta con Ollama:', error.message);
    
    // Fallback a respuestas simuladas más variadas
    const respuestasFallback = [
      "No sé… me cuesta hablar de eso.",
      "Puede ser, pero no creo que sea tan grave.",
      "No lo había pensado así.",
      "Prefiero no hablar de ese tema ahora.",
      "Mmm... (pausa) ¿por qué me pregunta eso?",
      "Últimamente todo me cuesta más."
    ];
    
    const respuesta = {
      texto: respuestasFallback[Math.floor(Math.random() * respuestasFallback.length)],
      confianza: 0.5,
      emociones: ['neutral'],
      metadata: {
        modo: 'fallback',
        error: error.message,
        mensaje: 'Ollama no disponible, usando respuestas simuladas'
      }
    };
    
    res.json(respuesta);
  }
});

// Health check para verificar conexión con Ollama
app.get('/api/ia/health', async (req, res) => {
  try {
    const response = await axios.get(getOllamaTagsURL(), {
      timeout: 5000
    });
    
    res.json({
      status: 'ok',
      ollama_conectado: true,
      ollama_url: `${OLLAMA_CONFIG.HOST}:${OLLAMA_CONFIG.PORT}`,
      modelo_configurado: OLLAMA_CONFIG.MODEL,
      modelos_disponibles: response.data.models || []
    });
  } catch (error) {
    res.json({
      status: 'warning',
      ollama_conectado: false,
      ollama_url: `${OLLAMA_CONFIG.HOST}:${OLLAMA_CONFIG.PORT}`,
      error: error.message,
      mensaje: 'Usando respuestas simuladas como fallback'
    });
  }
});

// Configurar servidor Ollama dinámicamente
app.post('/api/ia/configurar-servidor', async (req, res) => {
  try {
    const { serverType, config } = req.body;
    
    console.log(`[IA] Cambiando configuración a servidor: ${serverType}`);
    
    // Actualizar configuración
    OLLAMA_CONFIG.HOST = config.host;
    OLLAMA_CONFIG.PORT = config.port;
    
    console.log(`[IA] Nueva configuración: ${OLLAMA_CONFIG.HOST}:${OLLAMA_CONFIG.PORT}`);
    
    // Verificar conectividad
    try {
      await axios.get(getOllamaTagsURL(), { timeout: 5000 });
      res.json({
        success: true,
        mensaje: `Servidor cambiado a ${serverType}`,
        config: {
          host: OLLAMA_CONFIG.HOST,
          port: OLLAMA_CONFIG.PORT,
          modelo: OLLAMA_CONFIG.MODEL
        }
      });
    } catch (error) {
      res.json({
        success: true,
        warning: `Servidor configurado pero no se pudo verificar conectividad: ${error.message}`,
        config: {
          host: OLLAMA_CONFIG.HOST,
          port: OLLAMA_CONFIG.PORT,
          modelo: OLLAMA_CONFIG.MODEL
        }
      });
    }
    
  } catch (error) {
    console.error('[IA] Error configurando servidor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
