// API Service - Manejo de comunicación con el backend

const API = {
  
  // Obtener casos clínicos disponibles
  async getCases() {
    try {
      console.log('[API] Fetching cases from:', `${CONFIG.API_URL}/casos`);
      const response = await fetch(`${CONFIG.API_URL}/casos`);
      console.log('[API] Response status:', response.status);
      if (!response.ok) throw new Error('Error al obtener casos');
      const data = await response.json();
      console.log('[API] Cases loaded:', data.length);
      return data;
    } catch (error) {
      logger.error('Error obteniendo casos:', error);
      logger.error('URL intentada:', `${CONFIG.API_URL}/casos`);
      throw error;
    }
  },

  // Obtener detalles de un caso específico
  async getCase(caseId) {
    try {
      const response = await fetch(`${CONFIG.API_URL}/casos/${caseId}`);
      if (!response.ok) throw new Error('Error al obtener caso');
      return await response.json();
    } catch (error) {
      logger.error('Error obteniendo caso:', error);
      throw error;
    }
  },

  // Crear nueva sesión
  async createSession(caseId, studentId, studentName) {
    try {
      const response = await fetch(`${CONFIG.API_URL}/sesiones/nueva`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          caso_id: caseId,
          estudiante_id: studentId,
          estudiante_nombre: studentName
        })
      });
      
      if (!response.ok) throw new Error('Error al crear sesión');
      return await response.json();
    } catch (error) {
      logger.error('Error creando sesión:', error);
      throw error;
    }
  },

  // Obtener mensajes de una sesión
  async getMessages(sessionId) {
    try {
      const response = await fetch(
        `${CONFIG.API_URL}/sesiones/${sessionId}/mensajes`
      );
      if (!response.ok) throw new Error('Error al obtener mensajes');
      return await response.json();
    } catch (error) {
      logger.error('Error obteniendo mensajes:', error);
      throw error;
    }
  },

  // Guardar mensaje en la sesión
  async saveMessage(sessionId, role, content, audioUsed = false, metadata = {}) {
    try {
      const response = await fetch(
        `${CONFIG.API_URL}/sesiones/${sessionId}/mensajes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rol: role,
            contenido: content,
            audio_usado: audioUsed,
            metadata
          })
        }
      );
      
      if (!response.ok) throw new Error('Error al guardar mensaje');
      return await response.json();
    } catch (error) {
      logger.error('Error guardando mensaje:', error);
      throw error;
    }
  },

  // Generar respuesta del paciente (IA)
  async generateResponse(sessionId, question, caseId) {
    try {
      const response = await fetch(`${CONFIG.API_URL}/ia/generar-respuesta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          pregunta_estudiante: question,
          caso_id: caseId
        })
      });
      
      if (!response.ok) throw new Error('Error al generar respuesta');
      return await response.json();
    } catch (error) {
      logger.error('Error generando respuesta:', error);
      throw error;
    }
  },

  // Finalizar sesión
  async endSession(sessionId, notes, selfEvaluation) {
    try {
      const response = await fetch(
        `${CONFIG.API_URL}/sesiones/${sessionId}/finalizar`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notas_estudiante: notes,
            autoevaluacion: selfEvaluation
          })
        }
      );
      
      if (!response.ok) throw new Error('Error al finalizar sesión');
      return await response.json();
    } catch (error) {
      logger.error('Error finalizando sesión:', error);
      throw error;
    }
  }
};
