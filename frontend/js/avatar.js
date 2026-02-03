// Avatar Controller - Control del avatar visual del paciente

const AvatarController = {
  
  elements: {
    head: null,
    mouth: null,
    emotionText: null,
    speakingIndicator: null,
    avatarVisual: null
  },

  currentEmotion: 'neutral',

  init() {
    this.elements.head = document.querySelector('.avatar-head');
    this.elements.mouth = document.getElementById('avatar-mouth');
    this.elements.emotionText = document.getElementById('emotion-text');
    this.elements.speakingIndicator = document.getElementById('speaking-indicator');
    this.elements.avatarVisual = document.querySelector('.avatar-visual');
    
    logger.log('Avatar controller inicializado');
  },

  // Cambiar emoción del avatar
  setEmotion(emotion) {
    if (!this.elements.head) return;
    
    // Remover emoción anterior
    this.elements.head.classList.remove(`emotion-${this.currentEmotion}`);
    
    // Agregar nueva emoción
    this.currentEmotion = emotion;
    this.elements.head.classList.add(`emotion-${emotion}`);
    
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
    
    // Cambiar expresión de la boca
    this.updateMouthExpression(emotion);
    
    logger.log('Emoción cambiada a:', emotion);
  },

  // Actualizar expresión de la boca
  updateMouthExpression(emotion) {
    if (!this.elements.mouth) return;
    
    // Limpiar clases anteriores
    this.elements.mouth.classList.remove('smiling', 'sad', 'nervous');
    
    // Aplicar expresión según emoción
    switch(emotion) {
      case 'thoughtful':
        this.elements.mouth.classList.add('smiling');
        break;
      case 'sad':
      case 'uncomfortable':
        this.elements.mouth.classList.add('sad');
        break;
      case 'anxious':
      case 'nervous':
      case 'defensive':
        this.elements.mouth.classList.add('nervous');
        break;
    }
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
    
    logger.log('Avatar dejó de hablar');
  },

  // Animación de expresión (parpadeo, movimiento)
  express() {
    if (!this.elements.avatarVisual) return;
    
    this.elements.avatarVisual.classList.add('expressing');
    setTimeout(() => {
      this.elements.avatarVisual.classList.remove('expressing');
    }, 500);
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
