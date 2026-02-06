# Panel de Configuración de IA - Guía de Uso

## ✅ Cambios Implementados

### Frontend

1. **Panel de Configuración (Arriba a la Izquierda)**
   - Textbox con estado de conexión (conectado/desconectado/fallback)
   - Dropdown para seleccionar servidor Ollama
   - Visible desde todas las páginas de la app
   - Actualización automática cada 30 segundos

2. **Nuevos Archivos**
   - `frontend/js/ia-config.js` - Controlador del panel de configuración
   - Estilos agregados a `frontend/css/styles.css`
   - Configuración de servidores en `frontend/js/config.js`

3. **Estados Visuales**
   - **🟢 Verde (Conectado)**: IA funcionando correctamente
   - **🟠 Naranja (Fallback)**: Usando respuestas simuladas
   - **🔴 Rojo (Desconectado)**: Sin conexión al servidor

### Backend

1. **Configuración Dinámica**
   - El servidor ahora acepta cambios de configuración sin reiniciar
   - Objeto `OLLAMA_CONFIG` dinámico

2. **Nuevo Endpoint**
   - `POST /api/ia/configurar-servidor` - Cambiar servidor Ollama en tiempo real

3. **Endpoint Actualizado**
   - `GET /api/ia/health` - Devuelve estado usando la configuración actual

## 🚀 Cómo Usar

### Desde la Interfaz Web

1. **Abrir el frontend**
   ```
   http://localhost:8080/frontend/index.html
   ```

2. **Ver el panel** (arriba a la izquierda)
   - Estado actual de conexión
   - Servidor activo

3. **Cambiar servidor**
   - Seleccionar en el dropdown:
     - "Servidor Intranet (192.168.12.236)" → GPU del servidor
     - "Notebook Local (localhost:11434)" → Ollama en tu máquina
   
4. **Verificar cambio**
   - El estado se actualiza automáticamente
   - El texto muestra "✓ Conectado a [nombre del servidor]"

### Configuración de Servidores

Editar `frontend/js/config.js` para agregar más servidores:

```javascript
OLLAMA: {
  servers: {
    servidor: {
      host: '192.168.12.236',
      port: '11434',
      name: 'Servidor Intranet'
    },
    local: {
      host: 'localhost',
      port: '11434',
      name: 'Notebook Local'
    },
    // Agregar más servidores aquí
    nube: {
      host: 'mi-servidor-nube.com',
      port: '11434',
      name: 'Servidor en la Nube'
    }
  }
}
```

Luego agregar la opción en `frontend/index.html`:
```html
<select id="ollama-server">
  <option value="servidor">Servidor Intranet (192.168.12.236)</option>
  <option value="local">Notebook Local (localhost:11434)</option>
  <option value="nube">Servidor en la Nube</option>
</select>
```

## 📊 Flujo de Funcionamiento

### Inicio de la App

1. Frontend carga `ia-config.js`
2. Lee preferencia guardada de `localStorage`
3. Hace `GET /api/ia/health` para verificar estado
4. Muestra estado en el panel

### Cambio de Servidor

1. Usuario selecciona servidor en dropdown
2. JavaScript guarda preferencia en `localStorage`
3. Hace `POST /api/ia/configurar-servidor` con nueva config
4. Backend actualiza `OLLAMA_CONFIG`
5. Hace nuevo `GET /api/ia/health` para verificar
6. Actualiza indicador visual

### Durante la Conversación

1. Panel verifica estado cada 30 segundos
2. Si Ollama falla → muestra "⚠ Usando respuestas simuladas"
3. Usuario puede cambiar servidor sin perder la sesión
4. Próxima pregunta usa el nuevo servidor

## 🎨 Estilos CSS

El panel es responsive y se adapta a diferentes pantallas:

```css
.ia-config-panel {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1000;
  /* Siempre visible sobre otros elementos */
}
```

Estados visuales:
- `.status-dot.connected` → Verde pulsante
- `.status-dot.fallback` → Naranja
- `.status-dot.disconnected` → Rojo

## 🔧 API Backend

### GET /api/ia/health

**Response:**
```json
{
  "status": "ok",
  "ollama_conectado": true,
  "ollama_url": "192.168.12.236:11434",
  "modelo_configurado": "llama3.1:8b",
  "modelos_disponibles": [...]
}
```

### POST /api/ia/configurar-servidor

**Request:**
```json
{
  "serverType": "local",
  "config": {
    "host": "localhost",
    "port": "11434",
    "name": "Notebook Local"
  }
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Servidor cambiado a local",
  "config": {
    "host": "localhost",
    "port": "11434",
    "modelo": "llama3.1:8b"
  }
}
```

## 🐛 Troubleshooting

### El panel no aparece
- Verificar que `ia-config.js` esté cargado
- Abrir consola del navegador (F12) y buscar errores

### El estado siempre muestra "Desconectado"
- Verificar que el backend esté corriendo
- Probar manualmente: `http://localhost:3000/api/ia/health`
- Verificar CORS (el frontend debe estar en puerto 8080)

### Cambio de servidor no funciona
- Verificar que el nuevo servidor Ollama esté corriendo
- Probar conectividad: `curl http://localhost:11434/api/tags`
- Verificar logs del backend en la consola

### Respuestas siguen siendo simuladas
- El panel muestra "⚠ Usando respuestas simuladas"
- Verificar que Ollama responda en el servidor configurado
- Intentar cambiar a otro servidor que funcione

## 📝 Notas

- La preferencia del servidor se guarda en `localStorage` y persiste entre sesiones
- El cambio de servidor NO reinicia las sesiones activas
- El panel es visible en ambas vistas: selector de casos y sala de entrevista
- El backend soporta cambios sin reiniciar el servicio

---

**Fecha**: Febrero 2026  
**Versión**: 2.0  
**Proyecto**: Simulador de Pacientes Virtuales
