// Session Manager - Gestión de la sesión de entrevista

const SessionManager = {
  
  currentSession: null,
  currentCase: null,
  messageCount: 0,
  startTime: null,
  timerInterval: null,

  init() {
    this.startTime = new Date();
    this.startTimer();
    logger.log('Sesión inicializada');
  },

  // Crear nueva sesión
  async createSession(caseId, studentName = 'Estudiante') {
    try {
      const studentId = this.getStudentId();
      const sessionData = await API.createSession(caseId, studentId, studentName);
      
      this.currentSession = sessionData;
      this.currentCase = await API.getCase(caseId);
      
      this.init();
      
      logger.log('Sesión creada:', sessionData);
      return sessionData;
    } catch (error) {
      logger.error('Error creando sesión:', error);
      throw error;
    }
  },

  // Obtener o generar ID de estudiante
  getStudentId() {
    let studentId = localStorage.getItem('student_id');
    if (!studentId) {
      studentId = 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('student_id', studentId);
    }
    return studentId;
  },

  // Enviar mensaje del estudiante
  async sendMessage(text, fromVoice = false) {
    if (!this.currentSession) {
      logger.error('No hay sesión activa');
      return;
    }

    try {
      // Guardar mensaje del estudiante
      await API.saveMessage(
        this.currentSession.session_id,
        'Estudiante',
        text,
        fromVoice,
        { timestamp: new Date().toISOString() }
      );

      this.messageCount++;
      this.updateMessageCount();

      // Generar respuesta del paciente
      const response = await API.generateResponse(
        this.currentSession.session_id,
        text,
        this.currentCase.id
      );

      // Guardar respuesta del paciente
      await API.saveMessage(
        this.currentSession.session_id,
        'Paciente',
        response.texto,
        false,
        {
          emociones: response.emociones,
          confianza: response.confianza,
          metadata: response.metadata
        }
      );

      this.messageCount++;
      this.updateMessageCount();

      return response;
      
    } catch (error) {
      logger.error('Error enviando mensaje:', error);
      throw error;
    }
  },

  // Finalizar sesión
  async endSession(notes, selfEvaluation) {
    if (!this.currentSession) {
      logger.error('No hay sesión activa');
      return;
    }

    try {
      const result = await API.endSession(
        this.currentSession.session_id,
        notes,
        selfEvaluation
      );

      this.stopTimer();
      
      logger.log('Sesión finalizada:', result);
      return result;
      
    } catch (error) {
      logger.error('Error finalizando sesión:', error);
      throw error;
    }
  },

  // Timer de sesión
  startTimer() {
    this.timerInterval = setInterval(() => {
      this.updateSessionTime();
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  updateSessionTime() {
    const element = document.getElementById('session-time');
    if (!element || !this.startTime) return;

    const elapsed = Math.floor((new Date() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    element.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  updateMessageCount() {
    const element = document.getElementById('message-count');
    if (element) {
      element.textContent = this.messageCount;
    }
  },

  // Resetear sesión
  reset() {
    this.currentSession = null;
    this.currentCase = null;
    this.messageCount = 0;
    this.startTime = null;
    this.stopTimer();
  }
};
