// Controlador de configuración de IA

const IAConfigController = {
  statusCheckInterval: null,
  
  init() {
    this.setupEventListeners();
    this.loadSavedConfig();
    this.startStatusCheck();
  },
  
  setupEventListeners() {
    const serverSelect = document.getElementById('ollama-server');
    if (serverSelect) {
      serverSelect.addEventListener('change', (e) => {
        this.changeServer(e.target.value);
      });
    }
  },
  
  loadSavedConfig() {
    const saved = CONFIG.OLLAMA.currentServer;
    const serverSelect = document.getElementById('ollama-server');
    if (serverSelect) {
      serverSelect.value = saved;
    }
  },
  
  async changeServer(serverType) {
    logger.log('Cambiando servidor IA a:', serverType);
    
    // Guardar preferencia
    CONFIG.OLLAMA.currentServer = serverType;
    localStorage.setItem('ollama-server', serverType);
    
    // Notificar al backend
    try {
      await fetch(`${CONFIG.API_URL}/ia/configurar-servidor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serverType: serverType,
          config: CONFIG.OLLAMA.servers[serverType]
        })
      });
      
      // Verificar estado inmediatamente
      await this.checkStatus();
      
      logger.log('Servidor cambiado exitosamente');
    } catch (error) {
      logger.error('Error cambiando servidor:', error);
      this.updateStatus('disconnected', 'Error al cambiar servidor');
    }
  },
  
  async checkStatus() {
    try {
      const response = await fetch(`${CONFIG.API_URL}/ia/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.ollama_conectado) {
        const serverType = CONFIG.OLLAMA.currentServer === 'servidor' ? 'Servidor' : 'Local';
        this.updateStatus('connected', `✓ ${serverType}`);
      } else {
        this.updateStatus('fallback', '⚠ Simulado');
      }
      
    } catch (error) {
      logger.error('Error verificando estado:', error);
      this.updateStatus('disconnected', '✗ Sin conexión');
    }
  },
  
  updateStatus(status, message) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    
    if (dot) {
      // Remover clases anteriores
      dot.classList.remove('connected', 'disconnected', 'fallback');
      // Agregar nueva clase
      dot.classList.add(status);
    }
    
    if (text) {
      text.textContent = message;
    }
  },
  
  startStatusCheck() {
    // Check inicial
    this.checkStatus();
    
    // Check periódico cada 30 segundos
    this.statusCheckInterval = setInterval(() => {
      this.checkStatus();
    }, 30000);
  },
  
  stopStatusCheck() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => IAConfigController.init());
} else {
  IAConfigController.init();
}
