/**
 * Script de prueba para verificar conexión con Ollama
 * Ejecutar: node test-ollama.js
 */

require('dotenv').config();
const axios = require('axios');

const OLLAMA_HOST = process.env.OLLAMA_HOST || '192.168.12.236';
const OLLAMA_PORT = process.env.OLLAMA_PORT || '11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';

console.log('='.repeat(60));
console.log('PRUEBA DE CONEXIÓN CON OLLAMA');
console.log('='.repeat(60));
console.log(`Host: ${OLLAMA_HOST}`);
console.log(`Puerto: ${OLLAMA_PORT}`);
console.log(`Modelo: ${OLLAMA_MODEL}`);
console.log('');

async function probarConexion() {
  try {
    console.log('1. Verificando que Ollama esté accesible...');
    
    // Verificar que Ollama esté corriendo
    const tagsResponse = await axios.get(
      `http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags`,
      { timeout: 5000 }
    );
    
    console.log('   ✅ Ollama está respondiendo');
    console.log('   📦 Modelos disponibles:');
    tagsResponse.data.models.forEach(model => {
      console.log(`      - ${model.name}`);
    });
    console.log('');

    // Verificar que el modelo configurado existe
    const modeloExiste = tagsResponse.data.models.some(m => m.name.startsWith(OLLAMA_MODEL));
    if (!modeloExiste) {
      console.log(`   ⚠️  ADVERTENCIA: El modelo "${OLLAMA_MODEL}" no está disponible`);
      console.log(`   💡 Sugerencia: Ejecutá 'ollama pull ${OLLAMA_MODEL}' en el servidor`);
      console.log('');
    }

    console.log('2. Probando generación de respuesta...');
    console.log('');

    const prompt = `Actuás como Laura, una paciente de 32 años en terapia psicológica.

INFORMACIÓN:
- Motivo de consulta: "No estoy durmiendo bien, estoy cansada todo el tiempo"
- Tono: Seco, formal, un poco cansado

Terapeuta: Hola Laura, ¿qué te trae por acá hoy?
Paciente:`;

    const startTime = Date.now();
    
    const generateResponse = await axios.post(
      `http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 100,
          stop: ["\nTerapeuta:", "\nEstudiante:"]
        }
      },
      { timeout: 30000 }
    );

    const endTime = Date.now();
    const tiempo = endTime - startTime;

    console.log('   ✅ Respuesta generada exitosamente');
    console.log('');
    console.log('   📝 RESPUESTA DEL PACIENTE:');
    console.log('   ' + '-'.repeat(56));
    console.log(`   ${generateResponse.data.response.trim()}`);
    console.log('   ' + '-'.repeat(56));
    console.log('');
    console.log(`   ⏱️  Tiempo de respuesta: ${tiempo}ms (${(tiempo/1000).toFixed(2)}s)`);
    console.log(`   🔢 Tokens generados: ${generateResponse.data.eval_count || 'N/A'}`);
    
    if (tiempo < 2000) {
      console.log('   ✅ Excelente: Tiempo < 2 segundos');
    } else if (tiempo < 5000) {
      console.log('   ⚠️  Aceptable: Tiempo entre 2-5 segundos');
    } else {
      console.log('   ❌ Lento: Tiempo > 5 segundos (podría afectar experiencia de usuario)');
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 Próximos pasos:');
    console.log('   1. Iniciá el servidor backend: npm start');
    console.log('   2. Verificá el endpoint: http://localhost:3000/api/ia/health');
    console.log('   3. Probá la app completa desde el frontend');
    console.log('');

  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ ERROR EN LA PRUEBA');
    console.log('='.repeat(60));
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Soluciones posibles:');
      console.log('   1. Verificá que Ollama esté corriendo en el servidor');
      console.log('   2. Verificá la IP y puerto en el archivo .env');
      console.log('   3. Verificá que no haya firewall bloqueando el puerto 11434');
      console.log(`   4. Probá manualmente: curl http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Soluciones posibles:');
      console.log('   1. El servidor Ollama está muy lento o saturado');
      console.log('   2. Verificá la conectividad de red');
      console.log('   3. Aumentá el timeout en el código');
    } else if (error.response?.status === 404) {
      console.log('💡 Soluciones posibles:');
      console.log(`   1. El modelo "${OLLAMA_MODEL}" no está descargado`);
      console.log(`   2. Ejecutá en el servidor: ollama pull ${OLLAMA_MODEL}`);
    }
    
    console.log('');
    process.exit(1);
  }
}

probarConexion();
