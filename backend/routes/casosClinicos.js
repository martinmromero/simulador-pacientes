const express = require('express');
const router = express.Router();
const db = require('../database');

// Obtener todos los casos clínicos disponibles
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, nombre, edad, ocupacion, motivo_consulta, 
             dificultad, created_at
      FROM casos_clinicos
      WHERE activo = true
      ORDER BY dificultad, nombre
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo casos:', err);
    res.status(500).json({ error: 'Error al obtener casos clínicos' });
  }
});

// Obtener un caso específico con toda su información
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT * FROM casos_clinicos WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obteniendo caso:', err);
    res.status(500).json({ error: 'Error al obtener caso clínico' });
  }
});

// Crear nuevo caso clínico (para administradores/docentes)
router.post('/', async (req, res) => {
  try {
    const {
      nombre, edad, estado_civil, ocupacion,
      motivo_consulta, historia, estado_emocional,
      personalidad, contexto_sistema, dificultad,
      avatar_config
    } = req.body;
    
    const result = await db.query(`
      INSERT INTO casos_clinicos 
      (nombre, edad, estado_civil, ocupacion, motivo_consulta, 
       historia, estado_emocional, personalidad, contexto_sistema,
       dificultad, avatar_config)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [nombre, edad, estado_civil, ocupacion, motivo_consulta,
        historia, estado_emocional, personalidad, contexto_sistema,
        dificultad || 'intermedio', 
        JSON.stringify(avatar_config || {})]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando caso:', err);
    res.status(500).json({ error: 'Error al crear caso clínico' });
  }
});

module.exports = router;
