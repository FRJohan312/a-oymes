# 💝 Álbum de Aniversario Interactivo

Un álbum web romántico con características interactivas, juego secreto y múltiples efectos especiales.

## 📁 Archivos

- **`index.html`** - Página principal que verá ella (pública)
- **`admin.html`** - Panel de administración (solo para ti) 🔐
- **`styles.css`** - Estilos de la página principal
- **`script.js`** - Lógica JavaScript

## 🔐 Panel de Administración

### Cómo Acceder

Abre `admin.html` en tu navegador. **NO compartas** este archivo con ella.

### Funciones del Panel Admin

#### 1. ⏱️ Configuración de la Relación
- Establece la fecha y hora exacta de inicio de la relación
- El contador en `index.html` se actualizará automáticamente
- Muestra: años, meses, días, HH:MM:SS en tiempo real

#### 2. 🏆 Mensaje de Victoria
- Personaliza el mensaje que aparece al completar el juego secreto
- Mensaje predeterminado: "¡Ganaste, mi amor! Cada momento contigo es una victoria ❤️"

#### 3. 📸 Gestión de Fotos
- Sube fotos directamente desde el panel admin
- Las fotos aparecen automáticamente en `index.html`
- Posiciones iniciales aleatorias (ella puede reordenar arrastrándolas)
- Elimina fotos con el botón ×

#### 4. ⚡ Acciones Rápidas
- **Ver Página Principal**: Abre `index.html` en nueva pestaña
- **Exportar Configuración**: Descarga backup en JSON
- **Limpiar Todo**: Elimina TODAS las configuraciones y fotos

## 🌟 Características de la Página Principal (index.html)

### Funcionalidades Interactivas

1. **🔍 Lightbox Viewer**
   - Click en cualquier foto → vista pantalla completa
   - Navega con flechas del teclado (← →)
   - ESC para cerrar

2. **⏱️ Contador en Tiempo Real**
   - Muestra exactamente cuánto tiempo llevan juntos
   - Se actualiza cada segundo
   - Formato: "X años, Y meses, Z días HH:MM:SS"

3. **🎮 Juego Secreto**
   - Activación: **Triple-click** en el corazón ❤️ del badge
   - Juego de memoria con 8 pares de símbolos románticos
   - Al ganar: mensaje personalizado + confetti animado

4. **🎉 Confetti Animation**
   - Explosión de 150 partículas al ganar el juego
   - Corazones ❤️, estrellas ⭐, círculos coloridos
   - Física realista con gravedad

5. **💕 Cursor con Corazones**
   - Trail de corazones que siguen el mouse
   - Solo en desktop (optimizado)

6. **🎵 Música de Fondo**
   - Botón flotante rosa/dorado (inferior derecha)
   - Click para activar/desactivar
   - Estado se guarda automáticamente

## 💾 Cómo Funciona la Sincronización

Todos los cambios en `admin.html` se guardan en **localStorage** del navegador:

- `relationship_start_date` - Fecha de inicio
- `anniversary_victory_message` - Mensaje del juego
- `anniversary_images` - Array de fotos y posiciones

La página `index.html` lee automáticamente de localStorage, por lo que:
✅ Los cambios son **instantáneos**
✅ **No** necesitas recargar manualmente
✅ Funcionan **sin servidor**

> **Importante**: Usa el **mismo navegador** para admin.html e index.html

## 🚀 Deployment (GitHub Pages)

### Paso 1: Preparar Archivos

```bash
cd "c:\Users\johan\OneDrive\Documentos\Año y mes"
```

### Paso 2: Inicializar Git

```bash
git init
git add index.html styles.css script.js README.md
# NO incluyas admin.html en el repositorio público
git commit -m "💝 Álbum de aniversario interactivo"
```

### Paso 3: Subir a GitHub

```bash
git remote add origin https://github.com/TU-USUARIO/nombre-repo.git
git branch -M main
git push -u origin main
```

### Paso 4: Activar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: "Deploy from a branch"
4. Branch: "main" + "/ (root)"
5. Save

Tu sitio estará en: `https://TU-USUARIO.github.io/nombre-repo/`

### 🔒 Mantener admin.html Privado

Para usar el panel admin después de deployar:

1. Guarda `admin.html` localmente en tu PC
2. Abre con: `Ctrl + O` → selecciona `admin.html`
3. Haz tus cambios
4. Los cambios se guardan en localStorage **de TU navegador**
5. Comparte **solo** el enlace de `index.html` con ella

> **Nota**: Las configuraciones hechas en tu panel admin local NO se reflejarán automáticamente en el sitio público. Necesitarás que ella configure desde SU navegador, O puedes exportar la config y que ella la importe.

## 🎯 Flujo de Trabajo Recomendado

### Opción 1: Configuración Local
1. Abre `admin.html` localmente
2. Configura fecha, mensaje, sube fotos
3.Ella abre `index.html` localmente
4. Verá todo configurado ✅

### Opción 2: Con GitHub Pages
1. Sube `index.html`, `styles.css`, `script.js` a GitHub Pages
2. Envíale el link del sitio
3. Ella misma tendrá que configurar la fecha (o tú lo haces desde su PC una vez)
4. Las fotos las subes tú en `admin.html` desde SU PC/navegador

### Opción 3: Pre-configurado
1. Abre el navegador de ella.
2. Ve a la carpeta local y abre `admin.html`.
3. Configura todo (fecha, mensaje, fotos).
4. Cierra el admin.
5. Ahora cuando ella abra `index.html` en ese navegador, verá todo listo ✨

## 📊 Características Técnicas Corregidas ✅

- **Sincronización robusta**: Se unificaron las claves de `localStorage` (`relationship_start_date`, `anniversary_images`, `anniversary_victory_message`).
- **Renderizado de Polaroid**: Corregida la estructura del DOM para incluir el `.image-wrapper` necesario para los bordes blancos.
- **Lógica del Juego**: Sincronizadas las clases CSS (`game-card`) con el generador dinámico de JavaScript.
- **Contador Preciso**: Implementada lógica de cálculo de tiempo real (años, meses, días) que evita errores de `NaN`.

| Feature | Archivo | Estado |
|---------|---------|--------|
| Lightbox viewer | index.html + script.js | ✅ |
| Real-time counter | index.html + script.js | ✅ |
| Secret memory game | index.html + script.js | ✅ |
| Confetti animation | script.js | ✅ |
| Cursor hearts | script.js | ✅ |
| Background music | index.html + script.js | ✅ |
| Admin panel | admin.html | ✅ |
| Photo management | admin.html | ✅ |
| Responsive design | styles.css | ✅ |

## 💡 Tips

- **localStorage límite**: ~5MB por foto (usa imágenes comprimidas)
- **Navegador recomendado**: Chrome o Edge (mejor soporte)
- **Música**: Requiere interacción del usuario (política de navegadores)
- **Cursor trail**: Solo visible en desktop para mejor performance
- **Confetti**: Dura 5 segundos y se auto-limpia

## 🐛 Troubleshooting

### Las fotos no aparecen
- Asegúrate de usar el mismo navegador para admin e index
- Verifica que las imágenes no excedan 5MB
- Revisa la consola del navegador (F12)

### El contador no funciona
- Verifica que la fecha esté configurada en admin.html
- Comprueba que esté en formato datetime-local correcto
- Refresca la página

### El juego no se activa
- Haz **triple-click** (3 clicks rápidos) en el corazón ❤️
- No hagas clic doble, deben ser 3 clicks
- Verifica que estés clickeando el ícono del badge

### La música no suena
- Los navegadores bloquean autoplay
- El usuario debe hacer click en el botón de música
- Verifica que el archivo de audio cargue correctamente

## 📝 Créditos

Creado con ❤️ para celebrar un amor especial.

**Tecnologías**: HTML5, CSS3, Vanilla JavaScript, Canvas API, localStorage

**Sin dependencias** - 100% código propio
