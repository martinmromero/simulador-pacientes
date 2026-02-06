/**
 * Script para verificar modelos disponibles en Ollama
 * y comprobar si medgemma está instalado
 */

const axios = require('axios');

const OLLAMA_HOST = process.env.OLLAMA_HOST || '192.168.12.236';
const OLLAMA_PORT = process.env.OLLAMA_PORT || '11434';
const OLLAMA_URL = `http://${OLLAMA_HOST}:${OLLAMA_PORT}`;

async function checkModels() {
  console.log('='.repeat(60));
  console.log('🔍 VERIFICACIÓN DE MODELOS OLLAMA');
  console.log('='.repeat(60));
  console.log(`\n📡 Conectando a: ${OLLAMA_URL}`);
  
  try {
    // Obtener lista de modelos
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, {
      timeout: 10000
    });
    
    const models = response.data.models || [];
    
    console.log(`\n✅ Conexión exitosa!`);
    console.log(`\n📦 Modelos instalados (${models.length}):\n`);
    
    let medgemmaFound = false;
    let llama2Found = false;
    
    models.forEach((model, index) => {
      const name = model.name;
      const size = (model.size / (1024 * 1024 * 1024)).toFixed(2); // Convertir a GB
      const modified = new Date(model.modified_at).toLocaleString('es-ES');
      
      console.log(`${index + 1}. ${name}`);
      console.log(`   Tamaño: ${size} GB`);
      console.log(`   Modificado: ${modified}`);
      console.log('');
      
      // Verificar si es medgemma o llama2
      if (name.toLowerCase().includes('medgemma')) {
        medgemmaFound = true;
      }
      if (name.toLowerCase().includes('llama2') || name.toLowerCase().includes('llama-2')) {
        llama2Found = true;
      }
    });
    
    console.log('='.repeat(60));
    console.log('📊 ESTADO DE MODELOS REQUERIDOS:');
    console.log('='.repeat(60));
    console.log(`\nLlama 2: ${llama2Found ? '✅ Instalado' : '❌ No encontrado'}`);
    console.log(`MedGemma: ${medgemmaFound ? '✅ Instalado' : '❌ No encontrado'}`);
    
    if (!medgemmaFound) {
      console.log('\n⚠️  MEDGEMMA NO ENCONTRADO');
      console.log('\nPara instalar MedGemma, ejecuta:');
      console.log('   ollama pull medgemma');
      console.log('\nO si está en el servidor, conéctate por SSH y ejecuta:');
      console.log(`   ssh usuario@${OLLAMA_HOST}`);
      console.log('   ollama pull medgemma');
    }
    
    if (!llama2Found) {
      console.log('\n⚠️  LLAMA 2 NO ENCONTRADO');
      console.log('\nPara instalar Llama 2, ejecuta:');
      console.log('   ollama pull llama2');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR AL CONECTAR CON OLLAMA');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`\n⚠️  No se puede conectar a ${OLLAMA_URL}`);
      console.error('Verifica que:');
      console.error('  1. Ollama esté ejecutándose en el servidor');
      console.error('  2. La IP y puerto sean correctos');
      console.error('  3. El firewall permita la conexión');
    }
    
    console.log('\n' + '='.repeat(60));
    process.exit(1);
  }
}

// Ejecutar verificación
checkModels();
