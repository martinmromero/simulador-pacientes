// Speech Controller - Manejo de síntesis de voz y reconocimiento

const SpeechController = {
  
  synthesis: window.speechSynthesis,
  recognition: null,
  isRecording: false,
  audioEnabled: true,

  init() {
    // Configurar síntesis de voz
    if (!this.synthesis) {
      logger.warn('Síntesis de voz no disponible en este navegador');
    }

    // Configurar reconocimiento de voz
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = CONFIG.SPEECH_RECOGNITION.language;
      this.recognition.continuous = CONFIG.SPEECH_RECOGNITION.continuous;
      this.recognition.interimResults = CONFIG.SPEECH_RECOGNITION.interimResults;
      
      logger.log('Reconocimiento de voz inicializado');
    } else {
      logger.warn('Reconocimiento de voz no disponible en este navegador');
    }
  },

  // Hablar texto (TTS)
  speak(text, onStart = null, onEnd = null) {
    if (!this.synthesis || !this.audioEnabled) {
      logger.log('Audio deshabilitado o no disponible');
      if (onEnd) onEnd();
      return;
    }

    // Cancelar cualquier habla en progreso
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = CONFIG.AUDIO.language;
    utterance.rate = CONFIG.AUDIO.rate;
    utterance.pitch = CONFIG.AUDIO.pitch;
    utterance.volume = CONFIG.AUDIO.volume;

    // Seleccionar voz en español si está disponible
    const voices = this.synthesis.getVoices();
    const spanishVoice = voices.find(voice => 
      voice.lang.startsWith('es') && voice.name.includes('Female')
    ) || voices.find(voice => voice.lang.startsWith('es'));
    
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    // Callbacks
    utterance.onstart = () => {
      logger.log('Iniciando síntesis de voz');
      AvatarController.startSpeaking();
      if (onStart) onStart();
    };

    utterance.onend = () => {
      logger.log('Síntesis de voz finalizada');
      AvatarController.stopSpeaking();
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      logger.error('Error en síntesis de voz:', event);
      AvatarController.stopSpeaking();
      if (onEnd) onEnd();
    };

    this.synthesis.speak(utterance);
  },

  // Detener habla
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      AvatarController.stopSpeaking();
    }
  },

  // Iniciar reconocimiento de voz (STT)
  startRecognition(onResult, onError) {
    if (!this.recognition) {
      logger.error('Reconocimiento de voz no disponible');
      if (onError) onError('Reconocimiento de voz no disponible');
      return;
    }

    if (this.isRecording) {
      logger.warn('Ya hay una grabación en progreso');
      return;
    }

    this.isRecording = true;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      logger.log('Texto reconocido:', transcript, 'Confianza:', confidence);
      
      if (onResult) {
        onResult(transcript, confidence);
      }
      
      this.isRecording = false;
    };

    this.recognition.onerror = (event) => {
      logger.error('Error en reconocimiento de voz:', event.error);
      
      if (onError) {
        onError(event.error);
      }
      
      this.isRecording = false;
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      logger.log('Reconocimiento finalizado');
    };

    try {
      this.recognition.start();
      logger.log('Reconocimiento de voz iniciado');
    } catch (error) {
      logger.error('Error al iniciar reconocimiento:', error);
      this.isRecording = false;
      if (onError) onError(error);
    }
  },

  // Detener reconocimiento
  stopRecognition() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    }
  },

  // Alternar audio
  toggleAudio(enabled) {
    this.audioEnabled = enabled;
    logger.log('Audio:', enabled ? 'habilitado' : 'deshabilitado');
  },

  // Verificar disponibilidad
  isAvailable() {
    return {
      synthesis: !!this.synthesis,
      recognition: !!this.recognition
    };
  }
};

// Cargar voces cuando estén disponibles
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    logger.log('Voces disponibles:', voices.length);
    voices.filter(v => v.lang.startsWith('es')).forEach(v => {
      logger.log('- Voz española:', v.name, v.lang);
    });
  };
}
