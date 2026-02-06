# Sistema de Voz Mejorado - Documentación

## 🎙️ Mejoras Implementadas

El sistema de síntesis de voz (Text-to-Speech) ha sido actualizado para proporcionar una experiencia más realista y adecuada culturalmente.

---

## ✨ Nuevas Características

### 1. **Selección Automática de Género**

El sistema ahora detecta automáticamente el género del paciente y selecciona la voz apropiada:

- **Pacientes femeninos** → Voz femenina
- **Pacientes masculinos** → Voz masculina

#### Métodos de Detección:

1. **Campo en Base de Datos**: Si el caso clínico tiene el campo `genero` definido
2. **Detección por Nombre**: Analiza nombres comunes en español
3. **Heurística Lingüística**: 
   - Nombres terminados en 'a' → Femenino
   - Nombres terminados en 'o' → Masculino

### 2. **Español Latinoamericano**

El sistema ahora **prioriza voces de español latinoamericano** sobre español de España:

**Prioridad de selección:**
1. 🥇 Español Latinoamericano del género correcto (es-MX, es-AR, es-CO, etc.)
2. 🥈 Cualquier español latinoamericano del género correcto
3. 🥉 Español de España del género correcto
4. Fallback: Cualquier voz en español

**Locales latinoamericanos soportados:**
- `es-MX` - México
- `es-AR` - Argentina
- `es-CO` - Colombia
- `es-CL` - Chile
- `es-PE` - Perú
- `es-US` - Estados Unidos (español)

---

## 📋 Casos de Ejemplo

Con los casos clínicos existentes:

| Paciente | Edad | Género | Voz Seleccionada |
|----------|------|--------|------------------|
| **Laura** | 32 | Femenino | Voz femenina latinoamericana |
| **Carlos** | 45 | Masculino | Voz masculina latinoamericana |
| **María** | 19 | Femenino | Voz femenina latinoamericana |
| **Roberto** | 58 | Masculino | Voz masculina latinoamericana |

---

## 🔧 Configuración

### Base de Datos

Se agregó el campo `genero` a la tabla `casos_clinicos`:

```sql
ALTER TABLE casos_clinicos 
ADD COLUMN genero VARCHAR(20) CHECK (genero IN ('masculino', 'femenino', 'otro', NULL));
```

### Configuración Frontend

En `config.js`:

```javascript
AUDIO: {
  language: 'es-MX',  // Español Latinoamericano (México)
  rate: 1.0,
  pitch: 1.0,
  volume: 0.9
}
```

---

## 🎯 Uso en el Código

### Llamada Básica (Detección Automática)

```javascript
// El sistema detecta automáticamente el género del paciente actual
SpeechController.speak(respuesta.texto);
```

### Llamada Explícita con Género

```javascript
// Especificar género manualmente
SpeechController.speak(texto, null, null, 'femenino');
SpeechController.speak(texto, null, null, 'masculino');
```

---

## 🧪 Testing y Debug

### Ver Voces Disponibles

Al cargar la aplicación, abre la consola del navegador para ver:

```
📢 Voces disponibles: 45
🇪🇸 Voces en español: 12
🌎 Voces Latinoamericanas:
  ♀️ Microsoft Laura (es-MX)
  ♂️ Microsoft Raul (es-MX)
  ♀️ Google español de Estados Unidos (es-US)
🇪🇸 Voces de España:
  ♀️ Microsoft Helena (es-ES)
  ♂️ Microsoft Pablo (es-ES)
```

### Verificar Selección

Cuando el paciente habla, verás en la consola:

```
Voz seleccionada: Microsoft Laura Lang: es-MX
```

---

## 🗄️ Migración de Base de Datos

Si ya tienes casos clínicos existentes, ejecuta:

```bash
# Conectar a PostgreSQL
psql -U postgres -d simulador_pacientes

# Ejecutar migración
\i database/add-genero-field.sql
```

O manualmente:

```sql
-- Agregar campo
ALTER TABLE casos_clinicos ADD COLUMN genero VARCHAR(20);

-- Actualizar casos existentes
UPDATE casos_clinicos SET genero = 'femenino' WHERE nombre IN ('Laura', 'María');
UPDATE casos_clinicos SET genero = 'masculino' WHERE nombre IN ('Carlos', 'Roberto');
```

---

## 🆕 Crear Nuevos Casos Clínicos

Al crear un nuevo caso, incluye el campo `genero`:

```sql
INSERT INTO casos_clinicos (
    nombre, edad, genero, estado_civil, ocupacion, motivo_consulta, ...
) VALUES (
    'Ana',
    28,
    'femenino',
    'soltera',
    'ingeniera',
    'Tengo problemas de ansiedad...',
    ...
);
```

---

## 🌐 Compatibilidad de Navegadores

### Voces Disponibles por Sistema:

**Windows 10/11:**
- Microsoft Laura (es-MX) ♀️
- Microsoft Raul (es-MX) ♂️
- Microsoft Helena (es-ES) ♀️
- Microsoft Pablo (es-ES) ♂️

**macOS:**
- Monica (es-MX) ♀️
- Paulina (es-MX) ♀️
- Juan (es-MX) ♂️
- Diego (es-AR) ♂️

**Android/Chrome:**
- Voces de Google en varios acentos latinos

**iOS/Safari:**
- Mónica (es-MX) ♀️
- Paulina (es-MX) ♀️

---

## 📝 Archivos Modificados

1. **Frontend:**
   - `frontend/js/speech.js` - Lógica de selección de voz
   - `frontend/js/config.js` - Configuración de idioma
   - `frontend/js/app.js` - Paso de género al TTS

2. **Backend/Base de Datos:**
   - `database/init.sql` - Campo género en schema
   - `database/add-genero-field.sql` - Migración (nuevo)

---

## 💡 Tips

1. **Si no hay voces latinoamericanas**: El sistema automáticamente usará voces de España como fallback

2. **Agregar más voces**: 
   - Windows: Configuración → Hora e idioma → Voz
   - macOS: Preferencias del Sistema → Accesibilidad → Contenido hablado

3. **Testing**: Usa la consola del navegador para verificar qué voz se está usando

4. **Personalización**: Puedes ajustar `rate`, `pitch` y `volume` en `config.js`

---

## 🚀 Próximas Mejoras Posibles

- [ ] Permitir al usuario seleccionar el acento preferido (México, Argentina, Colombia, etc.)
- [ ] Ajustar tono y velocidad según la edad del paciente
- [ ] Variación emocional en el tono según el estado emocional
- [ ] Caché de preferencias de voz por usuario

---

*Última actualización: Febrero 2026*
