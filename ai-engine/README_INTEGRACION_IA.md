# Guía de Integración de IA Local

Este documento explica cómo integrar su propio modelo de IA al simulador de pacientes.

## Opciones de Modelos Recomendados

### 1. Modelos Open Source Locales

#### Llama 2 (Meta)
- **Tamaño**: 7B, 13B, 70B parámetros
- **Ventajas**: Excelente para diálogos, open source completo
- **Requisitos**: GPU con 16GB+ VRAM (7B), 32GB+ (13B)
- **Licencia**: Llama 2 Community License

#### Mistral 7B
- **Tamaño**: 7B parámetros
- **Ventajas**: Muy eficiente, buen rendimiento en español
- **Requisitos**: GPU con 16GB VRAM
- **Licencia**: Apache 2.0

#### Gemma (Google)
- **Tamaño**: 2B, 7B parámetros
- **Ventajas**: Optimizado para eficiencia
- **Requisitos**: GPU con 8GB+ VRAM (2B)
- **Licencia**: Gemma Terms of Use

### 2. Modelos Multilingües Optimizados para Español

- **BETO** (BERT en español)
- **MarIA** (RoBERTa español)
- **Llama 2 Spanish** (fine-tuned)

## Arquitectura de Integración

```
Frontend (HTML/JS)
    ↓
Backend API (Node.js)
    ↓
Motor IA (Python Flask)
    ↓
Modelo Local (PyTorch/Transformers)
```

## Pasos de Integración

### Paso 1: Preparar el Modelo

```python
# En ai-engine/server.py

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

def cargar_modelo(model_name="meta-llama/Llama-2-7b-chat-hf"):
    """
    Cargar modelo local
    """
    global model, tokenizer
    
    # Configurar dispositivo (GPU si está disponible)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Cargar tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        cache_dir="/models"
    )
    
    # Cargar modelo
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        cache_dir="/models",
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto"
    )
    
    print(f"✅ Modelo {model_name} cargado en {device}")
    return model, tokenizer
```

### Paso 2: Implementar Generación de Respuestas

```python
def generar_respuesta_paciente(prompt, max_length=150, temperature=0.7):
    """
    Generar respuesta del paciente usando el modelo
    """
    # Tokenizar input
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    # Generar respuesta
    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            max_length=max_length,
            temperature=temperature,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    # Decodificar
    respuesta = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extraer solo la respuesta del paciente (post-procesamiento)
    respuesta_paciente = extraer_respuesta_paciente(respuesta, prompt)
    
    return respuesta_paciente
```

### Paso 3: Fine-Tuning (Opcional pero Recomendado)

Para mejorar las respuestas específicas a contextos clínicos:

```python
# Preparar dataset de entrenamiento
# Formato: [{"prompt": "...", "completion": "..."}]

from transformers import Trainer, TrainingArguments

def fine_tune_modelo(dataset_path, output_dir="./modelo-pacientes-ft"):
    """
    Fine-tuning del modelo para casos clínicos
    """
    # Cargar dataset
    train_dataset = cargar_dataset_clinico(dataset_path)
    
    # Configurar entrenamiento
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        learning_rate=2e-5,
        fp16=True,
        logging_steps=10,
        save_steps=100
    )
    
    # Entrenar
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset
    )
    
    trainer.train()
    trainer.save_model(output_dir)
```

### Paso 4: Optimización para Producción

#### Quantización (reducir tamaño y memoria)

```python
from transformers import BitsAndBytesConfig

# Configuración 8-bit
quantization_config = BitsAndBytesConfig(
    load_in_8bit=True,
    llm_int8_threshold=6.0
)

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=quantization_config,
    device_map="auto"
)
```

#### Caching de Respuestas

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def obtener_respuesta_cache(prompt_hash):
    """
    Cachear respuestas para prompts similares
    """
    # Implementar lógica de cache
    pass
```

## Configuración de Docker para GPU

Modificar `docker-compose.yml`:

```yaml
ai-engine:
  # ... configuración existente ...
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

Asegurar que Docker tenga acceso a GPU:
```bash
# Instalar NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

## Requerimientos de Hardware

| Modelo | VRAM Mínima | RAM Recomendada | Rendimiento |
|--------|-------------|-----------------|-------------|
| Llama 2 7B (FP16) | 16 GB | 32 GB | ~10 tok/s |
| Llama 2 7B (8-bit) | 8 GB | 16 GB | ~8 tok/s |
| Mistral 7B (FP16) | 16 GB | 32 GB | ~12 tok/s |
| Gemma 2B (FP16) | 8 GB | 16 GB | ~15 tok/s |

## Ejemplo Completo de Integración

Ver archivo: `ai-engine/model_integration_example.py`

## Conexión Backend → IA

Modificar `backend/routes/ia.js` para usar el motor real:

```javascript
async function llamarIALocal(prompt) {
  try {
    const response = await fetch(`${process.env.AI_ENGINE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        max_length: 150,
        temperature: 0.7
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error llamando a IA:', error);
    throw error;
  }
}
```

## Monitoreo y Logs

- Métricas de uso: tokens/segundo, latencia
- Logs de errores
- Uso de GPU/CPU
- Historial de prompts para mejora continua

## Próximos Pasos

1. Elegir modelo base
2. Descargar modelo a `/models`
3. Descomentar código de carga en `ai-engine/server.py`
4. Iniciar con `docker-compose --profile ai up`
5. Evaluar respuestas y ajustar temperature/top_p
6. Considerar fine-tuning con casos propios
