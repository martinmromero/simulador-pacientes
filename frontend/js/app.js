// Aplicación Principal

let currentView = 'case-selector';

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  logger.log('Aplicación iniciada');
  
  // Inicializar controladores
  AvatarController.init();
  SpeechController.init();
  
  // Cargar casos clínicos
  await loadCases();
  
  // Event listeners
  setupEventListeners();
  
  // Verificar capacidades del navegador
  checkBrowserCapabilities();
});

// Cargar casos clínicos disponibles
async function loadCases() {
  try {
    logger.log('Iniciando carga de casos...');
    logger.log('API_URL:', CONFIG.API_URL);
    const cases = await API.getCases();
    logger.log('Casos recibidos:', cases);
    renderCases(cases);
  } catch (error) {
    logger.error('Error cargando casos:', error);
    showError('No se pudieron cargar los casos clínicos. Por favor, verifica que el servidor esté funcionando.');
  }
}

// Renderizar casos en la interfaz
function renderCases(cases) {
  const grid = document.getElementById('cases-grid');
  if (!grid) return;

  if (cases.length === 0) {
    grid.innerHTML = '<p>No hay casos clínicos disponibles.</p>';
    return;
  }

  grid.innerHTML = cases.map(caso => `
    <div class="case-card" onclick="selectCase(${caso.id})">
      <h3>${caso.nombre}</h3>
      <p class="case-meta">${caso.edad} años • ${caso.ocupacion}</p>
      <p>${caso.motivo_consulta}</p>
      <span class="difficulty ${caso.dificultad}">${caso.dificultad}</span>
    </div>
  `).join('');
}

// Seleccionar un caso e iniciar sesión
window.selectCase = async function(caseId) {
  try {
    // Crear sesión
    const studentName = prompt('Ingresa tu nombre:', 'Estudiante') || 'Estudiante';
    await SessionManager.createSession(caseId, studentName);
    
    // Cambiar a vista de entrevista
    switchToInterviewView();
    
    // Cargar info del paciente
    loadPatientInfo();
    
    // Mensaje de bienvenida
    addMessage('system', `Entrevista iniciada con ${SessionManager.currentCase.nombre}. El/la paciente está esperando...`);
    
  } catch (error) {
    logger.error('Error seleccionando caso:', error);
    alert('Error al iniciar la sesión: ' + error.message);
  }
}

// Cambiar vistas
function switchToInterviewView() {
  document.getElementById('case-selector').classList.add('hidden');
  document.getElementById('interview-room').classList.remove('hidden');
  currentView = 'interview';
}

function switchToCaseSelector() {
  document.getElementById('interview-room').classList.add('hidden');
  document.getElementById('case-selector').classList.remove('hidden');
  currentView = 'case-selector';
  
  // Limpiar chat
  document.getElementById('chat-messages').innerHTML = '';
  SessionManager.reset();
}

// Cargar información del paciente en la interfaz
function loadPatientInfo() {
  const caso = SessionManager.currentCase;
  if (!caso) return;

  document.getElementById('patient-name').textContent = caso.nombre;
  document.getElementById('patient-details').textContent = 
    `${caso.edad} años • ${caso.ocupacion}`;
  document.getElementById('consultation-reason').textContent = 
    `"${caso.motivo_consulta}"`;
}

// Agregar mensaje al chat
function addMessage(role, text, metadata = {}) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = text;

  const metaDiv = document.createElement('div');
  metaDiv.className = 'message-meta';
  metaDiv.textContent = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (metadata.fromVoice) {
    metaDiv.textContent += ' 🎤';
  }

  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(metaDiv);
  chatMessages.appendChild(messageDiv);

  // Scroll al final
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enviar mensaje
window.sendMessage = async function() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();

  if (!text) return;

  try {
    // Mostrar mensaje del estudiante
    addMessage('student', text);
    input.value = '';
    input.disabled = true;

    // Enviar a backend y obtener respuesta
    const response = await SessionManager.sendMessage(text, false);

    // Mostrar respuesta del paciente
    addMessage('patient', response.texto, { 
      emociones: response.emociones 
    });

    // Actualizar avatar
    if (response.emociones) {
      AvatarController.setEmotionFromResponse(response.emociones);
    }

    // Hablar respuesta si está habilitado
    const audioToggle = document.getElementById('audio-response-toggle');
    if (audioToggle && audioToggle.checked) {
      SpeechController.speak(response.texto);
    }

    input.disabled = false;
    input.focus();

  } catch (error) {
    logger.error('Error enviando mensaje:', error);
    alert('Error al enviar mensaje: ' + error.message);
    input.disabled = false;
  }
}

// Reconocimiento de voz
window.startVoiceInput = function() {
  const voiceBtn = document.getElementById('voice-btn');
  const input = document.getElementById('message-input');

  voiceBtn.classList.add('recording');
  voiceBtn.querySelector('.text').textContent = 'Escuchando...';

  SpeechController.startRecognition(
    (transcript) => {
      // Éxito
      input.value = transcript;
      voiceBtn.classList.remove('recording');
      voiceBtn.querySelector('.text').textContent = 'Voz';
      
      // Enviar automáticamente
      window.sendMessage();
    },
    (error) => {
      // Error
      logger.error('Error en reconocimiento de voz:', error);
      voiceBtn.classList.remove('recording');
      voiceBtn.querySelector('.text').textContent = 'Voz';
      alert('Error en el reconocimiento de voz: ' + error);
    }
  );
}

// Finalizar sesión
window.showEndSessionModal = function() {
  document.getElementById('end-session-modal').classList.remove('hidden');
}

window.hideEndSessionModal = function() {
  document.getElementById('end-session-modal').classList.add('hidden');
}

window.confirmEndSession = async function() {
  const notes = document.getElementById('student-notes').value;
  const rating = document.getElementById('self-rating').value;
  const comments = document.getElementById('self-comments').value;

  const selfEvaluation = {
    rating: rating ? parseInt(rating) : null,
    comments: comments
  };

  try {
    await SessionManager.endSession(notes, selfEvaluation);
    
    window.hideEndSessionModal();
    
    alert('Sesión finalizada correctamente');
    
    // Volver al selector de casos
    switchToCaseSelector();
    
  } catch (error) {
    logger.error('Error finalizando sesión:', error);
    alert('Error al finalizar la sesión: ' + error.message);
  }
}

// Event Listeners
function setupEventListeners() {
  // Enviar mensaje
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', window.sendMessage);
  }

  // Enter para enviar (Ctrl+Enter para nueva línea)
  const input = document.getElementById('message-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        window.sendMessage();
      }
    });
  }

  // Botón de voz
  const voiceBtn = document.getElementById('voice-btn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', window.startVoiceInput);
  }

  // Toggle de audio
  const audioToggle = document.getElementById('audio-response-toggle');
  if (audioToggle) {
    audioToggle.addEventListener('change', (e) => {
      SpeechController.toggleAudio(e.target.checked);
    });
  }

  // Finalizar sesión
  const endBtn = document.getElementById('end-session-btn');
  if (endBtn) {
    endBtn.addEventListener('click', window.showEndSessionModal);
  }

  const cancelEndBtn = document.getElementById('cancel-end-btn');
  if (cancelEndBtn) {
    cancelEndBtn.addEventListener('click', window.hideEndSessionModal);
  }

  const confirmEndBtn = document.getElementById('confirm-end-btn');
  if (confirmEndBtn) {
    confirmEndBtn.addEventListener('click', window.confirmEndSession);
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (currentView === 'interview') {
        if (confirm('¿Seguro que deseas salir? Se perderá la sesión actual.')) {
          switchToCaseSelector();
        }
      }
    });
  }
}

// Verificar capacidades del navegador
function checkBrowserCapabilities() {
  const capabilities = SpeechController.isAvailable();
  
  if (!capabilities.synthesis) {
    logger.warn('Síntesis de voz no disponible');
    showWarning('La síntesis de voz no está disponible en tu navegador');
  }
  
  if (!capabilities.recognition) {
    logger.warn('Reconocimiento de voz no disponible');
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
      voiceBtn.disabled = true;
      voiceBtn.title = 'Reconocimiento de voz no disponible en este navegador';
    }
  }
}

// Utilidades UI
function showLoading(message = 'Cargando...') {
  // Implementar overlay de carga
  logger.log('Loading:', message);
}

function hideLoading() {
  // Ocultar overlay
}

function showError(message) {
  alert('❌ ' + message);
}

function showWarning(message) {
  console.warn('⚠️ ' + message);
}
