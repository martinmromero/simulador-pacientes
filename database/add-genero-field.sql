-- Migración: Agregar campo género a casos clínicos
-- Fecha: Febrero 2026

-- Agregar columna género
ALTER TABLE casos_clinicos 
ADD COLUMN IF NOT EXISTS genero VARCHAR(20) CHECK (genero IN ('masculino', 'femenino', 'otro', NULL));

-- Actualizar casos existentes basándose en los nombres
UPDATE casos_clinicos SET genero = 'femenino' WHERE nombre = 'Laura';
UPDATE casos_clinicos SET genero = 'masculino' WHERE nombre = 'Carlos';
UPDATE casos_clinicos SET genero = 'femenino' WHERE nombre = 'María';
UPDATE casos_clinicos SET genero = 'masculino' WHERE nombre = 'Roberto';

-- Comentar la nueva columna
COMMENT ON COLUMN casos_clinicos.genero IS 'Género del paciente simulado (usado para selección de voz TTS)';

-- Verificar cambios
SELECT nombre, edad, genero, ocupacion FROM casos_clinicos;
