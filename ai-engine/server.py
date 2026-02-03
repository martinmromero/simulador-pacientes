"""
Motor de IA - Servidor placeholder para integración futura
Este servidor estará listo para recibir su modelo de IA local
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración
MODEL_PATH = os.getenv('MODEL_PATH', '/models')
API_PORT = int(os.getenv('API_PORT', 5000))

# Variables globales para el modelo (a implementar)
model = None
tokenizer = None

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'model_path': MODEL_PATH
    })

@app.route('/generate', methods=['POST'])
def generate():
    """
    Endpoint para generar respuestas del paciente
    
    Body esperado:
    {
        "prompt": "texto del prompt completo",
        "max_length": 150,
        "temperature": 0.7,
        "top_p": 0.9
    }
    """
    try:
        data = request.json
        prompt = data.get('prompt', '')
        max_length = data.get('max_length', 150)
        temperature = data.get('temperature', 0.7)
        
        logger.info(f"Generando respuesta para prompt de longitud: {len(prompt)}")
        
        # AQUÍ IRÍA LA LLAMADA AL MODELO REAL
        # Por ahora, respuestas simuladas
        
        respuestas_simuladas = [
            "No sé… me cuesta hablar de eso.",
            "Puede ser, pero no creo que sea tan grave.",
            "No lo había pensado así.",
            "Prefiero no hablar de ese tema ahora.",
            "No sé por qué me pongo así cuando me preguntan eso.",
            "Mmm... (pausa) ¿por qué me pregunta eso?",
            "Últimamente todo me cuesta más."
        ]
        
        import random
        respuesta = random.choice(respuestas_simuladas)
        
        return jsonify({
            'texto': respuesta,
            'confianza': 0.85,
            'metadata': {
                'modelo': 'simulado',
                'tokens': len(respuesta.split()),
                'temperature': temperature
            }
        })
        
    except Exception as e:
        logger.error(f"Error generando respuesta: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/load-model', methods=['POST'])
def load_model():
    """
    Cargar modelo de IA
    
    Body:
    {
        "model_name": "nombre del modelo",
        "model_path": "ruta opcional"
    }
    """
    global model, tokenizer
    
    try:
        data = request.json
        model_name = data.get('model_name')
        
        logger.info(f"Intentando cargar modelo: {model_name}")
        
        # AQUÍ IMPLEMENTARÍAN LA CARGA DEL MODELO REAL
        # Ejemplo con Hugging Face Transformers:
        """
        from transformers import AutoModelForCausalLM, AutoTokenizer
        
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            cache_dir=MODEL_PATH
        )
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        """
        
        return jsonify({
            'status': 'success',
            'message': 'Endpoint preparado para cargar modelo',
            'model_name': model_name
        })
        
    except Exception as e:
        logger.error(f"Error cargando modelo: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    """Listar modelos disponibles"""
    try:
        # Listar archivos en MODEL_PATH
        if os.path.exists(MODEL_PATH):
            models = os.listdir(MODEL_PATH)
        else:
            models = []
        
        return jsonify({
            'models': models,
            'model_path': MODEL_PATH
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info(f"🤖 Motor de IA iniciando en puerto {API_PORT}")
    logger.info(f"📁 Ruta de modelos: {MODEL_PATH}")
    logger.info("⚠️  Modo simulado - Listo para integrar modelo real")
    
    app.run(host='0.0.0.0', port=API_PORT, debug=False)
