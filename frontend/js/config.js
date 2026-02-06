// Configuración de la aplicación
const CONFIG = {
  API_URL: 'http://localhost:3000/api',
  WEBSOCKET_URL: 'ws://localhost:3000',
  
  // Configuración de servidor Ollama
  OLLAMA: {
    currentServer: localStorage.getItem('ollama-server') || 'servidor', // 'servidor' o 'local'
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
    }
  },
  
  // Configuración de audio
  AUDIO: {
    enabled: true,
    language: 'es-ES',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.9
  },
  
  // Configuración de reconocimiento de voz
  SPEECH_RECOGNITION: {
    language: 'es-ES',
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
