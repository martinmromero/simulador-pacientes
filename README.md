# Simulador de Pacientes Virtuales

Sistema completo para entrenamiento de estudiantes de psicología mediante pacientes simulados con IA.

## 🎯 Características

- ✅ **Multi-usuario**: Soporte para múltiples estudiantes simultáneos
- 🤖 **Avatar Visual**: Paciente virtual con expresiones y emociones
- 🎤 **Comunicación Dual**: Texto y voz (TTS/STT)
- 💾 **Persistencia**: Base de datos PostgreSQL con historial completo
- 🔌 **Listo para IA**: Arquitectura preparada para modelo local
- 🐳 **Docker**: Despliegue completo containerizado
- 📊 **Analytics**: Sistema de evaluación y métricas

## 📁 Estructura del Proyecto

```
simulador/
├── backend/              # API Node.js/Express
│   ├── routes/          # Rutas de API
│   ├── database.js      # Conexión a BD
│   ├── server.js        # Servidor principal
│   └── Dockerfile
├── frontend/            # Cliente web
│   ├── css/            # Estilos
│   ├── js/             # Lógica del cliente
│   └── index.html
├── database/            # Scripts SQL
│   └── init.sql        # Inicialización BD
├── ai-engine/          # Motor de IA (Python)
│   ├── server.py       # Servidor Flask
│   └── Dockerfile
├── nginx/              # Configuración proxy
└── docker-compose.yml  # Orquestación completa
```

## 🚀 Inicio Rápido

### Requisitos Previos

- Docker 20.10+
- Docker Compose 2.0+
- (Opcional) GPU NVIDIA para IA local

### Instalación

1. **Clonar/Navegar al proyecto**
```bash
cd simulador
```

2. **Configurar variables de entorno**
```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores
```

3. **Iniciar servicios sin IA** (para desarrollo inicial)
```bash
docker-compose up -d
```

4. **O iniciar con motor de IA** (cuando esté listo)
```bash
docker-compose --profile ai up -d
```

5. **Inicializar base de datos**
```bash
docker-compose exec backend npm run init-db
```

6. **Acceder a la aplicación**
- Frontend: http://localhost:8080
- API Backend: http://localhost:3000
- Motor IA: http://localhost:5000 (si está activo)

## 📖 Uso

### Para Estudiantes

1. Abrir http://localhost:8080
2. Seleccionar un caso clínico
3. Ingresar tu nombre
4. Comenzar la entrevista
5. Comunicarte por texto o voz
6. Tomar notas durante la sesión
7. Finalizar y autoevaluar

### Para Docentes

- Crear nuevos casos clínicos vía API
- Revisar sesiones de estudiantes
- Evaluar desempeño
- Ver estadísticas

## 🗄️ Base de Datos

### Tablas Principales

- `casos_clinicos`: Casos disponibles para simulación
- `sesiones`: Sesiones de entrevista
- `mensajes`: Historial de conversaciones
- `evaluaciones`: Evaluaciones de docentes
- `usuarios`: Estudiantes y docentes

### Casos de Ejemplo Incluidos

1. **Laura** (Intermedio): Problemas de sueño, ansiedad
2. **Carlos** (Intermedio): Conflictos post-divorcio
3. **María** (Básico): Ansiedad generalizada
4. **Roberto** (Avanzado): Crisis identidad post-jubilación

## 🤖 Integración de IA

El sistema está preparado para integrar su propio modelo de IA local:

### Modelos Recomendados

- **Llama 2 7B**: General purpose, buen español
- **Mistral 7B**: Eficiente, rápido
- **Gemma 2B**: Ligero, bueno para hardware limitado

### Pasos de Integración

Ver documentación detallada en: `ai-engine/README_INTEGRACION_IA.md`

1. Descargar modelo a `/models`
2. Actualizar `ai-engine/server.py`
3. Configurar GPU en Docker
4. Fine-tuning opcional para casos clínicos
5. Iniciar con perfil AI

## 🛠️ Desarrollo

### Backend (Node.js)

```bash
cd backend
npm install
cp .env.example .env
npm run dev  # Modo desarrollo con nodemon
```

### Frontend (HTML/JS)

Servir con cualquier servidor web:
```bash
cd frontend
python -m http.server 8080
# o
npx serve
```

### Base de Datos

```bash
# Conectar a PostgreSQL
docker-compose exec database psql -U postgres -d simulador_pacientes

# Ver casos
SELECT * FROM casos_clinicos;

# Ver sesiones activas
SELECT * FROM sesiones WHERE fin IS NULL;
```

## 📊 API Endpoints

### Casos Clínicos
- `GET /api/casos` - Listar casos
- `GET /api/casos/:id` - Obtener caso específico
- `POST /api/casos` - Crear nuevo caso

### Sesiones
- `POST /api/sesiones/nueva` - Crear sesión
- `GET /api/sesiones/:id/mensajes` - Obtener mensajes
- `POST /api/sesiones/:id/mensajes` - Guardar mensaje
- `PUT /api/sesiones/:id/finalizar` - Finalizar sesión

### IA
- `POST /api/ia/generar-respuesta` - Generar respuesta paciente

## 🔧 Configuración

### Variables de Entorno

```bash
# Backend
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=simulador_pacientes
DB_USER=postgres
DB_PASSWORD=tu_password
SESSION_SECRET=tu_secreto_seguro
AI_ENGINE_URL=http://localhost:5000

# AI Engine
MODEL_PATH=/models
API_PORT=5000
```

### Puertos

- 8080: Frontend (Nginx)
- 3000: Backend API
- 5432: PostgreSQL
- 5000: Motor IA (opcional)

## 🔐 Seguridad

### Para Producción

1. **Cambiar passwords**
   - `DB_PASSWORD` en `.env`
   - `SESSION_SECRET` con valor fuerte

2. **Configurar HTTPS**
   - Usar Nginx con SSL
   - Certificados Let's Encrypt

3. **Firewall**
   - Exponer solo puertos necesarios
   - Usar red privada para backend

4. **Autenticación**
   - Implementar login de usuarios
   - JWT tokens
   - Roles (estudiante/docente/admin)

## 📈 Monitoreo

```bash
# Logs de servicios
docker-compose logs -f backend
docker-compose logs -f ai-engine

# Estado de servicios
docker-compose ps

# Uso de recursos
docker stats
```

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Health checks
curl http://localhost:3000/health
curl http://localhost:5000/health
```

## 🤝 Contribuir

1. Crear casos clínicos adicionales
2. Mejorar expresiones del avatar
3. Agregar métricas de evaluación
4. Fine-tuning del modelo IA
5. Interfaz para docentes

## 📝 Roadmap

- [ ] Autenticación y roles de usuario
- [ ] Panel de administración para docentes
- [ ] Grabación de audio de sesiones
- [ ] Análisis de sentimiento en tiempo real
- [ ] Exportar sesiones a PDF
- [ ] Integración con LMS universitarios
- [ ] Soporte multiidioma
- [ ] Modo offline

## 🐛 Troubleshooting

### El frontend no se conecta al backend

- Verificar que backend esté corriendo: `docker-compose ps`
- Revisar CORS en `backend/server.js`
- Verificar URL en `frontend/js/config.js`

### Base de datos no se inicializa

```bash
docker-compose down -v  # Eliminar volúmenes
docker-compose up -d database
docker-compose exec backend npm run init-db
```

### Voz no funciona

- Verificar que el navegador soporte Web Speech API
- Solo funciona en HTTPS (excepto localhost)
- Chrome/Edge tienen mejor soporte que Firefox

## 📄 Licencia

MIT License - Libre uso educativo

## 👥 Contacto

Para soporte técnico o consultas sobre integración.

---

Desarrollado para Fundación H. A. Barceló
