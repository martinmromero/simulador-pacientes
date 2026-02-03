/***********************
 * CONTEXTO DEL PACIENTE
 ***********************/
const CONTEXTO_PACIENTE = `
Actuás exclusivamente como un PACIENTE SIMULADO para entrenamiento de estudiantes de psicología.

REGLAS:
- No expliques teoría psicológica.
- No des diagnósticos explícitos.
- No ayudes al estudiante.
- Respondé solo desde el rol del paciente.
- Mostrá inconsistencias, evasivas y emociones humanas reales.
- No seas excesivamente colaborativo.
- No avances información si no te la preguntan.
- Respondé como una persona real, no como un manual.

ESTILO:
- Lenguaje cotidiano.
- Respuestas de longitud variable.
- Emociones sutiles: incomodidad, duda, defensividad.
- A veces contradictoria.

CASO CLÍNICO:
Nombre: Laura
Edad: 32
Estado civil: convive con su pareja
Ocupación: administrativa

Motivo de consulta:
"No estoy durmiendo bien, estoy cansada todo el tiempo."

Historia:
- Problemas de sueño desde hace más de un año.
- Despertares nocturnos frecuentes.
- Minimiza lo emocional.
- Evita hablar del trabajo.
- Se incomoda si le preguntan por su infancia.
- No vino por iniciativa propia.

Estado emocional:
- Ansiedad basal moderada.
- Irritabilidad contenida.
- Miedo a exagerar sus síntomas.
`;

/***********************
 * ESTADO DE LA ENTREVISTA
 ***********************/
let historial = [];

/***********************
 * REFERENCIAS AL DOM
 ***********************/
const chat = document.getElementById("chat");
const input = document.getElementById("input");

/***********************
 * UTILIDADES
 ***********************/
function addMessage(rol, texto) {
  chat.innerHTML += `<p><b>${rol}:</b> ${texto}</p>`;
  chat.scrollTop = chat.scrollHeight;

  if (rol === "Paciente") {
    hablar(texto);
  }
}

/***********************
 * VOZ DEL PACIENTE
 ***********************/
function hablar(texto) {
  const msg = new SpeechSynthesisUtterance(texto);
  msg.lang = "es-ES";
  speechSynthesis.speak(msg);
}

/***********************
 * RECONOCIMIENTO DE VOZ
 ***********************/
function talk() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Reconocimiento de voz no soportado en este navegador.");
    return;
  }

  const rec = new webkitSpeechRecognition();
  rec.lang = "es-ES";
  rec.onresult = e => {
    input.value = e.results[0][0].transcript;
  };
  rec.start();
}

/***********************
 * CONSTRUCCIÓN DEL PROMPT
 ***********************/
function construirPrompt(preguntaAlumno) {
  let prompt = CONTEXTO_PACIENTE + "\n\nENTREVISTA:\n";

  historial.forEach(m => {
    prompt += `${m.rol}: ${m.texto}\n`;
  });

  prompt += `Estudiante: ${preguntaAlumno}\nPaciente:`;

  return prompt;
}

/***********************
 * RESPUESTAS SIMULADAS
 * (placeholder sin IA)
 ***********************/
function respuestaSimulada() {
  const respuestas = [
    "No sé… me cuesta hablar de eso.",
    "Puede ser, pero no creo que sea tan grave.",
    "No lo había pensado así.",
    "Prefiero no hablar de ese tema ahora.",
    "No sé por qué me pongo así cuando me preguntan eso.",
    "Supongo que siempre fui un poco nerviosa.",
    "No creo que tenga que ver con mi trabajo… aunque no sé."
  ];

  return respuestas[Math.floor(Math.random() * respuestas.length)];
}

/***********************
 * ENVÍO DEL MENSAJE
 ***********************/
function send() {
  const textoAlumno = input.value.trim();
  if (!textoAlumno) return;

  // Mostrar mensaje del estudiante
  addMessage("Estudiante", textoAlumno);
  historial.push({ rol: "Estudiante", texto: textoAlumno });
  input.value = "";

  // === ACÁ IRÍA LA IA REAL ===
  // const prompt = construirPrompt(textoAlumno);
  // enviar prompt a IA y recibir respuesta

  // Por ahora: respuesta simulada
  const textoPaciente = respuestaSimulada();

  historial.push({ rol: "Paciente", texto: textoPaciente });
  addMessage("Paciente", textoPaciente);

  // Para debug / docente:
  console.log("PROMPT COMPLETO:\n", construirPrompt(textoAlumno));
}
