-- Base de datos para Simulador de Pacientes Virtuales
-- PostgreSQL 14+

-- Crear base de datos (ejecutar como superusuario)
-- CREATE DATABASE simulador_pacientes;

-- Conectar a la base de datos
\c simulador_pacientes;

-- Tabla de casos clínicos
CREATE TABLE IF NOT EXISTS casos_clinicos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    edad INTEGER NOT NULL,
    estado_civil VARCHAR(50),
    ocupacion VARCHAR(100),
    motivo_consulta TEXT NOT NULL,
    historia TEXT NOT NULL,
    estado_emocional TEXT,
    personalidad TEXT,
    contexto_sistema TEXT NOT NULL,
    dificultad VARCHAR(20) DEFAULT 'intermedio' CHECK (dificultad IN ('basico', 'intermedio', 'avanzado')),
    avatar_config JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones de entrevista
CREATE TABLE IF NOT EXISTS sesiones (
    id UUID PRIMARY KEY,
    caso_id INTEGER REFERENCES casos_clinicos(id),
    estudiante_id VARCHAR(100) NOT NULL,
    estudiante_nombre VARCHAR(100),
    inicio TIMESTAMP NOT NULL,
    fin TIMESTAMP,
    notas_estudiante TEXT,
    autoevaluacion JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mensajes (historial de conversación)
CREATE TABLE IF NOT EXISTS mensajes (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES sesiones(id) ON DELETE CASCADE,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('Estudiante', 'Paciente', 'Sistema')),
    contenido TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    audio_usado BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- Tabla de evaluaciones (para docentes)
CREATE TABLE IF NOT EXISTS evaluaciones (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES sesiones(id),
    evaluador_id VARCHAR(100),
    evaluador_nombre VARCHAR(100),
    calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 10),
    competencias_evaluadas JSONB,
    retroalimentacion TEXT,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios (estudiantes y docentes)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    rol VARCHAR(20) DEFAULT 'estudiante' CHECK (rol IN ('estudiante', 'docente', 'admin')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_sesiones_estudiante ON sesiones(estudiante_id);
CREATE INDEX idx_sesiones_caso ON sesiones(caso_id);
CREATE INDEX idx_mensajes_session ON mensajes(session_id);
CREATE INDEX idx_mensajes_timestamp ON mensajes(timestamp);
CREATE INDEX idx_evaluaciones_session ON evaluaciones(session_id);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en casos_clinicos
CREATE TRIGGER update_casos_clinicos_updated_at
BEFORE UPDATE ON casos_clinicos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insertar caso clínico de ejemplo (Laura)
INSERT INTO casos_clinicos (
    nombre, edad, estado_civil, ocupacion, motivo_consulta,
    historia, estado_emocional, personalidad, contexto_sistema, dificultad
) VALUES (
    'Laura',
    32,
    'convive con su pareja',
    'administrativa',
    'No estoy durmiendo bien, estoy cansada todo el tiempo.',
    'Problemas de sueño desde hace más de un año. Despertares nocturnos frecuentes. Minimiza lo emocional. Evita hablar del trabajo. Se incomoda si le preguntan por su infancia. No vino por iniciativa propia.',
    'Ansiedad basal moderada. Irritabilidad contenida. Miedo a exagerar sus síntomas.',
    'Tendencia a la evitación emocional. Dificultad para conectar eventos externos con su malestar interno. Autoexigente. Valora mucho el control y la racionalidad.',
    'Actuás exclusivamente como un PACIENTE SIMULADO para entrenamiento de estudiantes de psicología.

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
- A veces contradictoria.',
    'intermedio'
);

-- Insertar más casos de ejemplo
INSERT INTO casos_clinicos (
    nombre, edad, estado_civil, ocupacion, motivo_consulta,
    historia, estado_emocional, personalidad, contexto_sistema, dificultad
) VALUES 
(
    'Carlos',
    45,
    'divorciado',
    'contador',
    'Mi ex dice que los chicos no quieren verme, pero no es verdad.',
    'Divorcio conflictivo hace 2 años. Tiene dos hijos (12 y 15 años). Relación tensa con ex pareja. Minimiza su responsabilidad en los conflictos. Tiende a victimizarse. Dificultad para reconocer perspectivas ajenas.',
    'Resentimiento. Sensación de injusticia. Cierta irritabilidad defensiva al hablar de la ex pareja.',
    'Rigidez cognitiva. Dificultad para empatizar. Externaliza responsabilidades. Necesita tener razón.',
    'Actuás como Carlos, un paciente que viene a consulta con conflictos familiares post-divorcio. Tenés dificultad para ver tu propia participación en los problemas. Sos defensivo cuando te cuestionan y tendes a culpar a otros.',
    'intermedio'
),
(
    'María',
    19,
    'soltera',
    'estudiante universitaria',
    'Creo que algo malo me va a pasar todo el tiempo.',
    'Primer año de universidad. Se mudó sola hace 6 meses. Antecedentes de ansiedad desde la adolescencia. Pensamientos catastróficos frecuentes. Evitación de situaciones sociales. Insomnio. Control excesivo del entorno.',
    'Ansiedad generalizada alta. Hipervigilancia. Tensión constante. Miedo anticipatorio.',
    'Perfeccionista. Rumiativa. Baja tolerancia a la incertidumbre. Necesita certezas y control.',
    'Actuás como María, una estudiante joven con ansiedad generalizada. Tus miedos son muy reales para vos aunque a veces reconocés que "quizás exagero". Tenés pensamientos catastróficos pero también momentos de lucidez.',
    'basico'
),
(
    'Roberto',
    58,
    'casado',
    'gerente jubilado',
    'Desde que dejé de trabajar me siento vacío, inútil.',
    'Jubilación hace 8 meses luego de 35 años en la misma empresa. Identidad muy ligada al trabajo. Dificultades para encontrar sentido a la vida actual. Tensión con su esposa. Aislamiento social progresivo. Pérdida de interés en actividades previas.',
    'Estado de ánimo depresivo. Apatía. Sensación de inutilidad. Nostalgia del pasado.',
    'Orientado a logros. Dificultad para el ocio. Necesidad de sentirse productivo. Rigidez en roles de género tradicionales.',
    'Actuás como Roberto, un hombre que está atravesando una crisis de identidad post-jubilación. Te cuesta mostrar vulnerabilidad y al principio minimizas el problema diciendo que "todos se jubilan". Poco a poco podés abrirte más.',
    'avanzado'
);

-- Crear vista para estadísticas
CREATE OR REPLACE VIEW estadisticas_sesiones AS
SELECT 
    c.nombre as paciente,
    COUNT(s.id) as total_sesiones,
    AVG(EXTRACT(EPOCH FROM (s.fin - s.inicio))/60) as duracion_promedio_minutos,
    AVG((SELECT COUNT(*) FROM mensajes WHERE session_id = s.id)) as mensajes_promedio
FROM casos_clinicos c
LEFT JOIN sesiones s ON c.id = s.caso_id
WHERE s.fin IS NOT NULL
GROUP BY c.id, c.nombre;

-- Comentarios en las tablas
COMMENT ON TABLE casos_clinicos IS 'Casos clínicos disponibles para simulación';
COMMENT ON TABLE sesiones IS 'Sesiones de entrevista entre estudiantes y pacientes virtuales';
COMMENT ON TABLE mensajes IS 'Historial de conversación de cada sesión';
COMMENT ON TABLE evaluaciones IS 'Evaluaciones realizadas por docentes sobre las sesiones';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema (estudiantes, docentes, administradores)';
