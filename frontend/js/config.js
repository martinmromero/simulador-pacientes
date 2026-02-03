// Configuración de la aplicación
const CONFIG = {
  API_URL: window.location.origin.replace(':8080', ':3000') + '/api',
  WEBSOCKET_URL: 'ws://' + window.location.hostname + ':3000',
  
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

// Log configuration on load
console.log('[CONFIG] API_URL:', CONFIG.API_URL);
console.log('[CONFIG] window.location.origin:', window.location.origin);

// Logger
const logger = {
  log: (...args) => CONFIG.DEBUG && console.log('[APP]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => CONFIG.DEBUG && console.warn('[WARN]', ...args)
};
