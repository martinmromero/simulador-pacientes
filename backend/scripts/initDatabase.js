const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Script para inicializar la base de datos

async function initDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    // Conectar a postgres por defecto para crear la BD
    database: 'postgres'
  });

  try {
    console.log('🔧 Inicializando base de datos...');

    // Verificar si la base de datos existe
    const dbName = process.env.DB_NAME || 'simulador_pacientes';
    const checkDb = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    // Crear base de datos si no existe
    if (checkDb.rows.length === 0) {
      console.log(`📦 Creando base de datos: ${dbName}`);
      await pool.query(`CREATE DATABASE ${dbName}`);
    } else {
      console.log(`✅ Base de datos ${dbName} ya existe`);
    }

    await pool.end();

    // Conectar a la base de datos recién creada
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    // Ejecutar script SQL de inicialización
    console.log('📝 Ejecutando scripts de inicialización...');
    const sqlPath = path.join(__dirname, '../database/init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await appPool.query(sql);
    
    console.log('✅ Base de datos inicializada correctamente');
    console.log('✅ Casos clínicos de ejemplo creados');
    
    // Mostrar resumen
    const casosResult = await appPool.query('SELECT COUNT(*) FROM casos_clinicos');
    console.log(`📊 Total de casos clínicos: ${casosResult.rows[0].count}`);

    await appPool.end();
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar
initDatabase();
