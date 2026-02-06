# Integración con Ollama - Guía de Configuración

## 🎯 Configuración Completada

La aplicación ahora está configurada para usar Ollama en tu servidor de intranet.

### Configuración actual:
- **IP**: 192.168.12.236
- **Puerto**: 11434
- **Modelo**: llama2 (configurable en .env)

---

## 🚀 Inicio Rápido

### 1. Probar conexión con Ollama

```bash
cd backend
node test-ollama.js
```

Este script verificará:
- ✅ Conectividad con el servidor Ollama
- ✅ Modelos disponibles
- ✅ Generación de respuesta de prueba
- ✅ Tiempo de respuesta

### 2. Iniciar el backend

```bash
cd backend
npm start
```

### 3. Verificar el health check

Abrí en tu navegador:
```
http://localhost:3000/api/ia/health
```

Deberías ver algo como:
```json
{
  "status": "ok",
  "ollama_conectado": true,
  "ollama_url": "192.168.12.236:11434",
  "modelo_configurado": "llama2",
  "modelos_disponibles": [
    { "name": "llama2:latest" },
    { "name": "mistral:latest" }
  ]
}
```

---

## ⚙️ Configuración (archivo .env)

El archivo `backend/.env` contiene:

```bash
# Configuración de Ollama (Intranet)
OLLAMA_HOST=192.168.12.236
OLLAMA_PORT=11434
OLLAMA_MODEL=llama2

# Parámetros de generación de IA
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=150
AI_TOP_P=0.9
```

### Modelos recomendados:
- `llama2` - Modelo general, buen equilibrio
- `llama2:13b` - Más preciso pero más lento
- `mistral` - Rápido y eficiente
- `neural-chat` - Optimizado para conversaciones

Para cambiar el modelo, editá `OLLAMA_MODEL` en el .env y reiniciá el backend.

---

## 🔧 Cambios Realizados

### 1. backend/package.json
- ✅ Agregada dependencia `axios` para HTTP requests

### 2. backend/.env
- ✅ Agregadas variables de configuración de Ollama
- ✅ Configurado host: 192.168.12.236
- ✅ Puerto: 11434
- ✅ Modelo por defecto: llama2

### 3. backend/routes/ia.js
- ✅ Implementada función `llamarOllama()` para conectarse al servidor
- ✅ Modificado endpoint `/generar-respuesta` para usar Ollama
- ✅ Agregado fallback a respuestas simuladas si Ollama no responde
- ✅ Agregado endpoint `/health` para verificar conectividad
- ✅ Logging de tiempos de respuesta

---

## 📊 Funcionamiento

### Flujo de generación de respuesta:

1. **Frontend** envía pregunta del estudiante → `POST /api/ia/generar-respuesta`
2. **Backend** obtiene:
   - Caso clínico de la BD
   - Historial de conversación
3. **Backend** construye prompt completo con contexto
4. **Backend** envía prompt a Ollama (192.168.12.236:11434)
5. **Ollama** genera respuesta usando el modelo configurado
6. **Backend** devuelve respuesta + metadata (tiempo, tokens, etc.)
7. **Frontend** muestra respuesta del paciente

### Fallback inteligente:
- Si Ollama no responde → usa respuestas simuladas
- Logs claros indican cuando está en modo fallback
- La app nunca se rompe por falta de conexión

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED"
```
❌ No se puede conectar a Ollama
```

**Soluciones:**
1. Verificá que Ollama esté corriendo en el servidor:
   ```bash
   ssh usuario@192.168.12.236
   ollama list
   ```

2. Verificá conectividad de red:
   ```bash
   ping 192.168.12.236
   curl http://192.168.12.236:11434/api/tags
   ```

3. Verificá firewall en el servidor:
   ```bash
   # En el servidor Ollama
   sudo ufw allow 11434
   ```

### Error: "Model not found"
```
❌ El modelo "llama2" no está disponible
```

**Solución:**
En el servidor Ollama, descargá el modelo:
```bash
ollama pull llama2
# o
ollama pull mistral
```

### Respuestas muy lentas (> 10 segundos)
```
⚠️ Tiempo de respuesta alto
```

**Soluciones:**
1. Usá un modelo más pequeño en .env:
   ```bash
   OLLAMA_MODEL=mistral
   ```

2. Reducí `AI_MAX_TOKENS`:
   ```bash
   AI_MAX_TOKENS=100
   ```

3. Verificá carga del servidor:
   ```bash
   ssh usuario@192.168.12.236
   nvidia-smi  # Ver uso de GPU
   htop        # Ver uso de CPU
   ```

### Backend usa respuestas simuladas
```
⚠️ [IA] Ollama no disponible, usando respuestas simuladas
```

Esto es normal si:
- Ollama está temporalmente caído
- Hay problemas de red
- El modelo está ocupado

La app funciona igual pero con respuestas genéricas.

---

## 📈 Monitoreo

### Ver logs en tiempo real:
```bash
cd backend
npm start
```

Verás logs como:
```
[IA] Configurado para usar Ollama en 192.168.12.236:11434 con modelo llama2
[IA] Session: abc-123 | Modelo: llama2 | Tiempo: 1250ms
[IA] Session: def-456 | Modelo: llama2 | Tiempo: 980ms
```

### Métricas importantes:
- ⏱️ **Tiempo de respuesta**: Ideal < 3 segundos
- 🎯 **Tasa de éxito**: % de veces que Ollama responde vs fallback
- 📊 **Tokens generados**: Cantidad de texto generado

---

## 🎯 Próximos Pasos

1. ✅ **Probá la conexión**: `node test-ollama.js`
2. ✅ **Iniciá el backend**: `npm start`
3. ✅ **Verificá health**: `http://localhost:3000/api/ia/health`
4. ✅ **Probá desde el frontend**: Iniciá una sesión con un paciente
5. 📊 **Monitoreá rendimiento**: Registrá tiempos de respuesta
6. 🔧 **Optimizá si es necesario**: Ajustá modelo o parámetros

---

## 🔐 Consideraciones de Seguridad

- ℹ️ Ollama en intranet (192.168.12.236) = Sin autenticación
- ✅ OK para ambiente de desarrollo/universidad
- ⚠️ NO expongas el puerto 3000 a internet sin autenticación
- 💡 Para producción: Agregá autenticación JWT o OAuth

---

**Fecha**: Febrero 2026  
**Versión**: 1.0  
**Proyecto**: Simulador de Pacientes Virtuales
