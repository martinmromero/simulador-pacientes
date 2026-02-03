const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Crear nueva sesión de entrevista
router.post('/nueva', async (req, res) => {
  try {
    const { caso_id, estudiante_id, estudiante_nombre } = req.body;
    const session_id = uuidv4();
    
    const result = await db.query(`
      INSERT INTO sesiones 
      (id, caso_id, estudiante_id, estudiante_nombre, inicio)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [session_id, caso_id, estudiante_id || req.session.userId, estudiante_nombre]);
    
    res.status(201).json({
      session_id: result.rows[0].id,
      caso_id: result.rows[0].caso_id,
      inicio: result.rows[0].inicio
    });
  } catch (err) {
    console.error('Error creando sesión:', err);
    res.status(500).json({ error: 'Error al crear sesión' });
  }
});

// Obtener historial de una sesión
router.get('/:session_id/mensajes', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const result = await db.query(`
      SELECT id, rol, contenido, timestamp, audio_usado, metadata
      FROM mensajes
      WHERE session_id = $1
      ORDER BY timestamp ASC
    `, [session_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo mensajes:', err);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// Guardar un nuevo mensaje en la sesión
router.post('/:session_id/mensajes', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { rol, contenido, audio_usado, metadata } = req.body;
    
    const result = await db.query(`
      INSERT INTO mensajes 
      (session_id, rol, contenido, audio_usado, metadata, timestamp)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [session_id, rol, contenido, audio_usado || false, 
        JSON.stringify(metadata || {})]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error guardando mensaje:', err);
    res.status(500).json({ error: 'Error al guardar mensaje' });
  }
});

// Finalizar sesión
router.put('/:session_id/finalizar', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { notas_estudiante, autoevaluacion } = req.body;
    
    const result = await db.query(`
      UPDATE sesiones 
      SET fin = NOW(),
          notas_estudiante = $2,
          autoevaluacion = $3
      WHERE id = $1
      RETURNING *
    `, [session_id, notas_estudiante, JSON.stringify(autoevaluacion || {})]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error finalizando sesión:', err);
    res.status(500).json({ error: 'Error al finalizar sesión' });
  }
});

// Obtener sesiones de un estudiante
router.get('/estudiante/:estudiante_id', async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    
    const result = await db.query(`
      SELECT s.*, c.nombre as paciente_nombre
      FROM sesiones s
      JOIN casos_clinicos c ON s.caso_id = c.id
      WHERE s.estudiante_id = $1
      ORDER BY s.inicio DESC
    `, [estudiante_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo sesiones:', err);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

module.exports = router;
