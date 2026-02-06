// Configuración de la aplicación
const CONFIG = {
  API_URL: 'http://localhost:3000/api',
  WEBSOCKET_URL: 'ws://localhost:3000',
  
  // Configuración de servidor Ollama
  OLLAMA: {
    currentServer: localStorage.getItem('ollama-server') || 'servidor', // 'servidor' o 'local'
    currentModel: localStorage.getItem('ai-model') || 'llama3.1:8b', // Modelo por defecto
    servers: {
      servidor: {
        host: '192.168.12.236',
        port: '11434',
        name: 'Servidor Intranet'
      },
      local: {
        host: 'localhost',
        port: '11434',
        name: 'Notebook Local'
      }
    },
    models: {
      'llama3.1:8b': {
        name: 'Llama 3.1 (8B)',
        description: 'Modelo general de lenguaje - Meta'
      },
      'medgemma-4b-it-Q6_K:latest': {
        name: 'MedGemma (4B)',
        description: 'Modelo especializado en medicina - Google'
      },
      'gemma3:4b': {
        name: 'Gemma 3 (4B)',
        description: 'Modelo general - Google'
      },
      'mistral:7b': {
        name: 'Mistral (7B)',
        description: 'Modelo general - Mistral AI'
      }
    }
  },
  
  // Configuración de audio
  AUDIO: {
    enabled: true,
    language: 'es-MX', // Español Latinoamericano (México como predeterminado)
    rate: 1.0,
    pitch: 1.0,
    volume: 0.9
  },
  
  // Configuración de reconocimiento de voz
  SPEECH_RECOGNITION: {
    language: 'es-MX', // Español Latinoamericano
    continuous: false,
    interimResults: false
  },
  
  // Debugging
  DEBUG: true
};

// Logger utility
const logger = {
  log: (...args) => CONFIG.DEBUG && console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => CONFIG.DEBUG && console.warn('[WARN]', ...args)
};

// Log configuration on load
console.log('[CONFIG] API_URL:', CONFIG.API_URL);
console.log('[CONFIG] window.location.origin:', window.location.origin);
console.log('[CONFIG] Ollama Server:', CONFIG.OLLAMA.currentServer);
