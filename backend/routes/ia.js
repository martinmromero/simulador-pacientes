const express = require('express');
const router = express.Router();
const db = require('../database');
const axios = require('axios');

// Configuración de Ollama desde variables de entorno
const OLLAMA_HOST = process.env.OLLAMA_HOST || '192.168.12.236';
const OLLAMA_PORT = process.env.OLLAMA_PORT || '11434';
let OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b'; // Ahora es variable
const OLLAMA_URL = `http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/generate`;

const AI_TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS) || 150;
const AI_TOP_P = parseFloat(process.env.AI_TOP_P) || 0.9;

console.log(`[IA] Configurado para usar Ollama en ${OLLAMA_HOST}:${OLLAMA_PORT} con modelo ${OLLAMA_MODEL}`);

// Respuestas simuladas (fallback si Ollama no responde)
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

// Función para llamar a Ollama
async function llamarOllama(prompt) {
  try {
    const response = await axios.post(
      OLLAMA_URL,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: AI_TEMPERATURE,
          num_predict: AI_MAX_TOKENS,
          top_p: AI_TOP_P,
          stop: ["\nTerapeuta:", "\nEstudiante:", "\n\n"]
        }
      },
      {
        timeout: 30000, // 30 segundos timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      texto: response.data.response.trim(),
      confianza: 0.9,
      metadata: {
        modo: 'ollama',
        modelo: OLLAMA_MODEL,
        tokens: response.data.eval_count || 0,
        tiempo_ms: response.data.total_duration ? Math.round(response.data.total_duration / 1000000) : 0
      }
    };
  } catch (error) {
    console.error('[IA] Error llamando a Ollama:', error.message);
    throw error;
  }
}

// Generar respuesta del paciente
router.post('/generar-respuesta', async (req, res) => {
  try {
    const { session_id, pregunta_estudiante, caso_id } = req.body;
    
    // 1. Obtener contexto del caso clínico
    const caso = await db.query(
      'SELECT * FROM casos_clinicos WHERE id = $1',
      [caso_id]
    );
    
    if (caso.rows.length === 0) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }
    
    // 2. Obtener historial de la conversación
    const historial = await db.query(
      `SELECT rol, contenido FROM mensajes 
       WHERE session_id = $1 
       ORDER BY timestamp ASC`,
      [session_id]
    );
    
    // 3. Construir prompt para IA
    const prompt = construirPrompt(
      caso.rows[0], 
      historial.rows, 
      pregunta_estudiante
    );
    
    // 4. Llamar a Ollama
    let respuesta;
    try {
      const startTime = Date.now();
      respuesta = await llamarOllama(prompt);
      const endTime = Date.now();
      
      respuesta.emociones = detectarEmocion(pregunta_estudiante);
      respuesta.metadata.tiempo_total_ms = endTime - startTime;
      
      console.log(`[IA] Session: ${session_id} | Modelo: ${OLLAMA_MODEL} | Tiempo: ${respuesta.metadata.tiempo_total_ms}ms`);
      
    } catch (ollamaError) {
      // Fallback a respuestas simuladas si Ollama falla
      console.warn('[IA] Ollama no disponible, usando respuestas simuladas');
      respuesta = {
        texto: respuestasSimuladas[Math.floor(Math.random() * respuestasSimuladas.length)],
        confianza: 0.5,
        emociones: detectarEmocion(pregunta_estudiante),
        metadata: {
          modo: 'simulado_fallback',
          error: ollamaError.message,
          modelo: 'ninguno'
        }
      };
    }
    
    res.json(respuesta);
    
  } catch (err) {
    console.error('Error generando respuesta:', err);
    res.status(500).json({ error: 'Error al generar respuesta' });
  }
});

// Función para construir el prompt completo
function construirPrompt(caso, historial, preguntaActual) {
  let prompt = `${caso.contexto_sistema}\n\n`;
  prompt += `CASO CLÍNICO:\n`;
  prompt += `Nombre: ${caso.nombre}\n`;
  prompt += `Edad: ${caso.edad}\n`;
  prompt += `Ocupación: ${caso.ocupacion}\n\n`;
  prompt += `Motivo de consulta: ${caso.motivo_consulta}\n\n`;
  prompt += `Historia: ${caso.historia}\n\n`;
  prompt += `Estado emocional: ${caso.estado_emocional}\n\n`;
  prompt += `Personalidad: ${caso.personalidad}\n\n`;
  
  prompt += `ENTREVISTA:\n`;
  historial.forEach(msg => {
    prompt += `${msg.rol}: ${msg.contenido}\n`;
  });
  
  prompt += `Estudiante: ${preguntaActual}\n`;
  prompt += `Paciente:`;
  
  return prompt;
}

// Detectar emoción básica (placeholder)
function detectarEmocion(pregunta) {
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
}

// Endpoint para verificar conexión con Ollama
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags`, {
      timeout: 5000
    });
    
    res.json({
      status: 'ok',
      ollama_conectado: true,
      ollama_url: `${OLLAMA_HOST}:${OLLAMA_PORT}`,
      modelo_configurado: OLLAMA_MODEL,
      modelos_disponibles: response.data.models || []
    });
  } catch (error) {
    res.json({
      status: 'warning',
      ollama_conectado: false,
      ollama_url: `${OLLAMA_HOST}:${OLLAMA_PORT}`,
      error: error.message,
      mensaje: 'Usando respuestas simuladas como fallback'
    });
  }
});

// Endpoint para obtener lista de modelos disponibles
router.get('/modelos-disponibles', async (req, res) => {
  try {
    const response = await axios.get(`http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags`, {
      timeout: 5000
    });
    
    const modelos = response.data.models?.map(m => ({
      name: m.name,
      size: m.size,
      modified_at: m.modified_at
    })) || [];
    
    res.json({
      modelos: modelos,
      modelo_actual: OLLAMA_MODEL
    });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener la lista de modelos',
      mensaje: error.message
    });
  }
});

// Endpoint para configurar el modelo de IA
router.post('/configurar-modelo', async (req, res) => {
  try {
    const { model } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: 'Se requiere especificar el modelo' });
    }
    
    // Actualizar el modelo actual
    OLLAMA_MODEL = model;
    
    console.log(`[IA] Modelo cambiado a: ${OLLAMA_MODEL}`);
    
    // Verificar que el modelo esté disponible en Ollama
    try {
      const response = await axios.get(`http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags`, {
        timeout: 5000
      });
      
      const modelExists = response.data.models?.some(m => m.name.includes(model));
      
      res.json({ 
        mensaje: `Modelo configurado: ${OLLAMA_MODEL}`,
        modelo_actual: OLLAMA_MODEL,
        modelo_disponible: modelExists,
        advertencia: modelExists ? null : 'El modelo no está disponible en el servidor Ollama. Se usará cuando esté instalado.'
      });
    } catch (error) {
      // Si no podemos verificar, asumimos que está bien
      res.json({ 
        mensaje: `Modelo configurado: ${OLLAMA_MODEL}`,
        modelo_actual: OLLAMA_MODEL,
        advertencia: 'No se pudo verificar disponibilidad del modelo'
      });
    }
    
  } catch (error) {
    console.error('[IA] Error configurando modelo:', error);
    res.status(500).json({ error: 'Error al configurar modelo' });
  }
});

module.exports = router;
