# Modelos de IA Disponibles

## 📋 Modelos Configurados

La aplicación ahora soporta múltiples modelos de IA. Puedes seleccionar el modelo que desees usar desde el dropdown en la parte superior izquierda de la interfaz.

### Modelos Disponibles en el Servidor:

#### 1. **Llama 3.1 (8B)** - *Modelo por defecto*
- **ID**: `llama3.1:8b`
- **Tamaño**: 4.58 GB
- **Descripción**: Modelo de lenguaje general de Meta. Excelente para conversaciones generales y comprensión de contexto.
- **Uso recomendado**: Casos clínicos generales, entrevistas psicológicas estándar

#### 2. **MedGemma (4B) - Especializado en Medicina** ⭐
- **ID**: `medgemma-4b-it-Q6_K:latest`
- **Tamaño**: 2.97 GB
- **Descripción**: Modelo de Google especializado en medicina. Optimizado para terminología médica y casos clínicos.
- **Uso recomendado**: Simulaciones con terminología médica específica, casos clínicos complejos
- **Ventaja**: Mejor comprensión de términos médicos y síntomas

#### 3. **Gemma 3 (4B)**
- **ID**: `gemma3:4b`
- **Tamaño**: 3.11 GB
- **Descripción**: Modelo general de Google, más compacto y rápido.
- **Uso recomendado**: Respuestas rápidas, simulaciones simples

#### 4. **Mistral (7B)**
- **ID**: `mistral:7b`
- **Tamaño**: 4.07 GB
- **Descripción**: Modelo de Mistral AI, conocido por su eficiencia y coherencia.
- **Uso recomendado**: Balance entre velocidad y calidad de respuesta

---

## 🔄 Cómo Cambiar de Modelo

### Desde la Interfaz:

1. En la esquina superior izquierda, verás dos dropdowns:
   - **Primer dropdown**: Selección de servidor (Intranet o Local)
   - **Segundo dropdown**: Selección de modelo de IA

2. Haz clic en el segundo dropdown y selecciona el modelo que desees usar

3. El cambio es instantáneo y se guarda en tu navegador

### Configuración Persistente:

La selección de modelo se guarda en `localStorage` y se mantendrá entre sesiones.

---

## 🎯 Recomendaciones de Uso

### Para Casos de Psicología Clínica:
- **Llama 3.1**: Primera opción para la mayoría de casos
- **MedGemma**: Cuando el caso incluye síntomas físicos o terminología médica

### Para Casos de Medicina:
- **MedGemma**: Primera opción (especializado)
- **Llama 3.1**: Alternativa si necesitas respuestas más conversacionales

### Para Pruebas Rápidas:
- **Gemma 3**: Más rápido, ideal para iteraciones de desarrollo
- **Mistral**: Balance velocidad/calidad

---

## 📊 Otros Modelos Disponibles en el Servidor

El servidor tiene 21 modelos instalados. Los siguientes también están disponibles pero no están en el dropdown principal:

- `llama3.1:latest` (4.58 GB)
- `gemma3:12b` (7.59 GB) - Más grande, más preciso
- `gemma3:1b` (0.76 GB) - Muy rápido, menos preciso
- `deepseek-r1:8b` (4.87 GB) - Modelo de DeepSeek
- `codellama:7b` (3.56 GB) - Especializado en código
- `openthinker:latest` (4.36 GB)
- Y más...

Para agregar más modelos al dropdown, edita:
- `frontend/index.html` (opciones del select)
- `frontend/js/config.js` (configuración de modelos)

---

## 🔧 Configuración Backend

El backend ahora soporta cambio dinámico de modelo. El modelo actual se puede cambiar mediante:

### API Endpoint:
```http
POST /api/ia/configurar-modelo
Content-Type: application/json

{
  "model": "medgemma-4b-it-Q6_K:latest"
}
```

### Variables de Entorno:
Puedes configurar el modelo por defecto en `.env`:
```env
OLLAMA_MODEL=medgemma-4b-it-Q6_K:latest
```

---

## 📝 Testing

Para verificar qué modelos están disponibles en el servidor, ejecuta:

```bash
cd backend
node check-models.js
```

Este script te mostrará:
- Lista completa de modelos instalados
- Tamaño de cada modelo
- Verificación de modelos requeridos

---

## 🚀 Próximos Pasos

Si quieres instalar más modelos en el servidor, conéctate por SSH:

```bash
ssh usuario@192.168.12.236
ollama pull <nombre-del-modelo>
```

Modelos recomendados para agregar:
- `llama2` - Si necesitas compatibilidad con versiones anteriores
- `gemma3:12b` - Para mejor precisión (usa más recursos)
- `deepseek-r1:8b` - Razonamiento avanzado

---

## ⚙️ Archivos Modificados

Los siguientes archivos fueron actualizados para soportar múltiples modelos:

1. **Frontend**:
   - `frontend/index.html` - Dropdown de selección de modelo
   - `frontend/js/config.js` - Configuración de modelos disponibles
   - `frontend/js/ia-config.js` - Lógica de cambio de modelo
   - `frontend/css/styles.css` - Estilos del nuevo dropdown

2. **Backend**:
   - `backend/routes/ia.js` - Soporte para cambio dinámico de modelo
   - `backend/check-models.js` - Script de verificación (nuevo)

---

## 💡 Tips

- **MedGemma es ideal para tu proyecto** ya que estás simulando pacientes y puede incluir síntomas físicos
- El cambio de modelo NO interrumpe las sesiones activas
- Puedes experimentar con diferentes modelos para el mismo caso y comparar resultados
- Los modelos más grandes (12B, 16B) ofrecen mejor calidad pero son más lentos

---

*Última actualización: Febrero 2026*
