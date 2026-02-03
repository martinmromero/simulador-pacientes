const express = require('express');
const router = express.Router();
const db = require('../database');

// Respuestas simuladas (temporal, hasta tener IA)
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
    
    // 4. AQUÍ SE LLAMARÁ A LA IA REAL
    // const respuesta = await llamarIALocal(prompt);
    
    // Por ahora: respuesta simulada
    const respuesta = {
      texto: respuestasSimuladas[Math.floor(Math.random() * respuestasSimuladas.length)],
      confianza: 0.85,
      emociones: detectarEmocion(pregunta_estudiante),
      metadata: {
        modo: 'simulado',
        prompt_tokens: prompt.length,
        modelo: 'pendiente'
      }
    };
    
    // 5. Registrar en logs para análisis
    console.log(`[IA] Session: ${session_id} | Prompt: ${prompt.substring(0, 100)}...`);
    
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

// Endpoint para futuro: conectar con motor de IA propio
router.post('/configurar-modelo', async (req, res) => {
  // Para cuando implementen su propio LLM
  res.json({ 
    mensaje: 'Endpoint preparado para configurar modelo de IA local',
    estado: 'no implementado aún'
  });
});

module.exports = router;
