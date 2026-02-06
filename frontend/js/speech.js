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
  speak(text, onStart = null, onEnd = null, gender = null) {
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

    // Seleccionar voz apropiada según género y región
    const voices = this.synthesis.getVoices();
    const selectedVoice = this.selectVoice(voices, gender);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      logger.log('Voz seleccionada:', selectedVoice.name, 'Lang:', selectedVoice.lang);
    } else {
      logger.warn('No se encontró voz apropiada, usando voz por defecto');
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

  // Seleccionar voz apropiada según género
  selectVoice(voices, gender) {
    // Si no se especifica género, intentar detectar desde el caso actual
    if (!gender && window.currentCase) {
      gender = this.detectGenderFromName(window.currentCase.nombre);
    }

    const isFemale = gender === 'femenino' || gender === 'female' || gender === 'f';
    const isMale = gender === 'masculino' || gender === 'male' || gender === 'm';

    // Prioridad de búsqueda:
    // 1. Español Latinoamericano (es-MX, es-AR, es-CO, es-US) del género correcto
    // 2. Cualquier español latinoamericano del género correcto
    // 3. Español de España del género correcto
    // 4. Cualquier español del género correcto
    // 5. Cualquier español

    const latinAmericanLocales = ['es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE', 'es-US'];
    
    // Filtrar voces en español
    const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
    
    if (spanishVoices.length === 0) {
      logger.warn('No hay voces en español disponibles');
      return null;
    }

    // Intentar encontrar voz latinoamericana del género correcto
    if (isFemale || isMale) {
      const genderMatch = isFemale ? 
        (name) => name.toLowerCase().includes('female') || name.toLowerCase().includes('woman') || name.toLowerCase().includes('femenina') || name.toLowerCase().includes('mujer') :
        (name) => name.toLowerCase().includes('male') || name.toLowerCase().includes('man') || name.toLowerCase().includes('masculina') || name.toLowerCase().includes('hombre');
      
      // 1. Español latinoamericano del género correcto
      for (const locale of latinAmericanLocales) {
        const voice = spanishVoices.find(v => v.lang === locale && genderMatch(v.name));
        if (voice) return voice;
      }
      
      // 2. Cualquier español latinoamericano del género correcto (locale contiene guión pero no es ES)
      const latinVoice = spanishVoices.find(v => 
        v.lang !== 'es-ES' && v.lang.includes('-') && genderMatch(v.name)
      );
      if (latinVoice) return latinVoice;
      
      // 3. Español de España del género correcto
      const spainVoice = spanishVoices.find(v => v.lang === 'es-ES' && genderMatch(v.name));
      if (spainVoice) return spainVoice;
      
      // 4. Cualquier español del género correcto
      const anyGenderVoice = spanishVoices.find(v => genderMatch(v.name));
      if (anyGenderVoice) return anyGenderVoice;
    }

    // 5. Fallback: cualquier voz latinoamericana
    for (const locale of latinAmericanLocales) {
      const voice = spanishVoices.find(v => v.lang === locale);
      if (voice) return voice;
    }
    
    // 6. Fallback final: cualquier voz en español
    return spanishVoices[0];
  },

  // Detectar género basado en el nombre
  detectGenderFromName(nombre) {
    if (!nombre) return null;
    
    const nombreLower = nombre.toLowerCase().trim();
    
    // Nombres femeninos comunes
    const femaleNames = [
      'laura', 'maría', 'ana', 'carmen', 'isabel', 'elena', 'marta', 'patricia',
      'sofia', 'lucía', 'valentina', 'camila', 'paula', 'andrea', 'daniela',
      'gabriela', 'Carolina', 'natalia', 'claudia', 'alejandra', 'victoria',
      'fernanda', 'mariana', 'silvia', 'rosa', 'julia', 'beatriz', 'teresa'
    ];
    
    // Nombres masculinos comunes
    const maleNames = [
      'carlos', 'juan', 'josé', 'luis', 'miguel', 'pedro', 'jorge', 'roberto',
      'fernando', 'david', 'javier', 'manuel', 'francisco', 'antonio', 'daniel',
      'rafael', 'andrés', 'alberto', 'ricardo', 'pablo', 'diego', 'alejandro',
      'sergio', 'eduardo', 'mario', 'raúl', 'gabriel', 'martín'
    ];
    
    if (femaleNames.some(name => nombreLower.includes(name))) {
      return 'femenino';
    }
    
    if (maleNames.some(name => nombreLower.includes(name))) {
      return 'masculino';
    }
    
    // Si termina en 'a', probablemente femenino (en español)
    if (nombreLower.endsWith('a')) {
      return 'femenino';
    }
    
    // Si termina en 'o', probablemente masculino
    if (nombreLower.endsWith('o')) {
      return 'masculino';
    }
    
    return null; // No se pudo determinar
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
    logger.log('📢 Voces disponibles:', voices.length);
    
    const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
    logger.log(`🇪🇸 Voces en español: ${spanishVoices.length}`);
    
    // Agrupar por tipo
    const latinVoices = spanishVoices.filter(v => v.lang !== 'es-ES' && v.lang.includes('-'));
    const spainVoices = spanishVoices.filter(v => v.lang === 'es-ES');
    
    if (latinVoices.length > 0) {
      logger.log('🌎 Voces Latinoamericanas:');
      latinVoices.forEach(v => {
        const gender = v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') ? '♀️' : 
                      v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man') ? '♂️' : '⚪';
        logger.log(`  ${gender} ${v.name} (${v.lang})`);
      });
    }
    
    if (spainVoices.length > 0) {
      logger.log('🇪🇸 Voces de España:');
      spainVoices.forEach(v => {
        const gender = v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') ? '♀️' : 
                      v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man') ? '♂️' : '⚪';
        logger.log(`  ${gender} ${v.name} (${v.lang})`);
      });
    }
  };
}
