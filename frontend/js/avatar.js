// Avatar Controller - Control del avatar visual del paciente

const AvatarController = {
  
  elements: {
    video: null,
    overlay: null,
    emotionText: null,
    speakingIndicator: null
  },

  currentEmotion: 'neutral',

  init() {
    this.elements.video = document.getElementById('avatar-video');
    this.elements.overlay = document.getElementById('avatar-overlay');
    this.elements.emotionText = document.getElementById('emotion-text');
    this.elements.speakingIndicator = document.getElementById('speaking-indicator');
    
    // Configurar video
    if (this.elements.video) {
      this.elements.video.play().catch(err => {
        logger.warn('Autoplay bloqueado, el usuario debe interactuar primero');
      });
    }
    
    logger.log('Avatar controller inicializado con video');
  },

  // Cambiar emoción del avatar
  setEmotion(emotion) {
    if (!this.elements.overlay) return;
    
    // Remover emoción anterior
    this.elements.overlay.classList.remove(this.currentEmotion);
    
    // Agregar nueva emoción
    this.currentEmotion = emotion;
    this.elements.overlay.classList.add(emotion);
    
    // Actualizar texto
    const emotionTexts = {
      neutral: 'Neutral',
      uncomfortable: 'Incómodo/a',
      defensive: 'Defensivo/a',
      thoughtful: 'Pensativo/a',
      anxious: 'Ansioso/a',
      sad: 'Triste',
      nervous: 'Nervioso/a'
    };
    
    if (this.elements.emotionText) {
      this.elements.emotionText.textContent = emotionTexts[emotion] || 'Neutral';
    }
    
    logger.log('Emoción cambiada a:', emotion);
  },

  // Actualizar expresión de la boca (ahora solo cambia overlay)
  updateMouthExpression(emotion) {
    // El video ya tiene expresiones, solo aplicamos overlay
    this.setEmotion(emotion);
  },

  // Iniciar animación de habla
  startSpeaking() {
    if (!this.elements.mouth || !this.elements.speakingIndicator) return;
    
    this.elements.mouth.classList.add('speaking');
    this.elements.speakingIndicator.classList.remove('hidden');
    
    logger.log('Avatar hablando');
  },

  // Detener animación de habla
  stopSpeaking() {
    if (!this.elements.mouth || !this.elements.speakingIndicator) return;
    
    this.elements.mouth.classList.remove('speaking');
    this.elements.speakingIndicator.classList.add('hidden');
    
    // Pausar video cuando no habla (opcional)
    // if (this.elements.video) {
    //   this.elements.video.pause();
    // }
    
    logger.log('Avatar dejó de hablar');
  },

  // Animación de expresión
  express() {
    if (!this.elements.video) return;
    
    // Reproducir video si está pausado
    if (this.elements.video.paused) {
      this.elements.video.play().catch(err => {
        logger.warn('No se pudo reproducir el video:', err);
      });
    }
  },

  // Establecer emoción basada en respuesta de IA
  setEmotionFromResponse(emotions) {
    if (!emotions || emotions.length === 0) {
      this.setEmotion('neutral');
      return;
    }
    
    // Mapeo de emociones de IA a emociones de avatar
    const emotionMap = {
      'incomodidad': 'uncomfortable',
      'evasión': 'defensive',
      'tensión': 'anxious',
      'defensividad': 'defensive',
      'reflexión': 'thoughtful',
      'vulnerabilidad': 'sad',
      'neutral': 'neutral',
      'nerviosismo': 'nervous'
    };
    
    const primaryEmotion = emotions[0].toLowerCase();
    const avatarEmotion = emotionMap[primaryEmotion] || 'neutral';
    
    this.setEmotion(avatarEmotion);
    this.express();
  }
};
