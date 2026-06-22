# 🎵 Reglas y Lineamientos del Proyecto: Reproductor de Música Moderno

¡Bienvenido al proyecto! Este documento define la arquitectura, el stack tecnológico y las reglas de diseño para contribuir al desarrollo de nuestro reproductor de música. 

## 📌 1. Descripción del Proyecto
Este es un reproductor de música web enfocado en la experiencia de usuario (UX/UI) para Desktop, con escalabilidad proyectada para dispositivos móviles.
*   **Tipo:** Aplicación Frontend pura (Client-side).
*   **Autenticación:** No requiere Login ni registro de usuarios.
*   **Fuente de medios:** La aplicación leerá archivos `mp3` (audio) y `mp4` (video/carátulas animadas) desde una carpeta de recursos local.
*   **Objetivo Visual:** Estilo **Modern Vinyl** (Vinilo Moderno), fusionando el minimalismo, interfaces de cristal (glassmorphism) y estética retro-futurista de alta fidelidad.

## 🛠️ 2. Stack Tecnológico
*   **Librería Principal:** React.
*   **Gestor de Paquetes:** `pnpm` (Estrictamente requerido para consistencia en dependencias).
*   **Estilos:** Tailwind CSS v4.2.

## 🏗️ 3. Arquitectura del Proyecto (Vertical Slices)
Utilizamos una arquitectura orientada a características (Vertical Slicing) combinada con principios de Arquitectura Limpia. Esto asegura que la lógica esté aislada y el código sea altamente escalable.

### Estructura de Directorios Principal
```text
src/
├── api/          # Declaraciones de interfaces/servicios HTTP (Preparado para el futuro, sin backend actual)
├── layout/       # Contenedores globales de la interfaz
│   ├── MainLayout/
│   ├── Navbar/
│   └── Sidebar/
├── features/     # Agrupación por características del negocio (Vertical Slices)
│   ├── Player/
│   ├── Library/
│   └── Settings/
└── ...
```

### Reglas internas para las `features`
Cada característica (Feature) debe ser independiente y agrupar sus propios submódulos. Un módulo dentro de una feature **debe** seguir esta estructura estricta:

```text
features/<NombreDeLaFeature>/<NombreDelModulo>/
├── components/   # Componentes visuales específicos de este módulo (Ej: Botón de Play)
├── pages/        # Vistas completas ensambladas con componentes
├── hooks/        # Lógica de React aislada (Ej: useAudioPlayer)
├── services/     # Lógica de negocio pura o llamadas a la carpeta api/
└── utils/        # Funciones auxiliares o formateadores (Ej: formatTime)
└── router/
```
*   **Aislamiento:** Un módulo no debe importar directamente componentes internos de otro módulo. Si algo se comparte, debe promoverse a una carpeta global de `shared/` o `ui/`.

## 🎨 4. Guía de Diseño y UI (Tendencias 2026 - Modern Vinyl)
El proyecto busca un balance entre la nostalgia analógica del vinilo y el minimalismo digital moderno.

### Paleta de Colores (Tendencia 2026)
Utilizaremos un modo oscuro profundo con acentos vibrantes e inmersivos que simulan la iluminación LED de los tocadiscos de alta gama:
*   **Fondo Principal (Matte Obsidian):** `#0A0A0C` (Un negro suave, no absoluto, que reduce la fatiga visual).
*   **Superficies/Paneles (Carbon Record):** `#141417` (Para el Sidebar y tarjetas de álbumes).
*   **Acento Primario (Electric Amber):** `#FF4A1C` (Color cálido, inspirado en los tubos de vacío y amplificadores analógicos. Ideal para el botón de Play y barras de progreso).
*   **Acento Secundario (Bioluminescent Cyan):** `#00F0FF` (Para estados activos, hover en menús y detalles sutiles).
*   **Texto Principal:** `#F4F4F5` (Zinc-100 para legibilidad alta).
*   **Texto Secundario:** `#A1A1AA` (Zinc-400 para metadatos, duración, artistas).

### Estética "Modern Vinyl"
*   **Componente del Reproductor:** El artwork del álbum en reproducción debe ser circular y rotar sutilmente (animación en CSS) cuando la música esté en Play, simulando un disco de vinilo.
*   **Glassmorphism Controlado:** El `Navbar` y los menús modales deben usar desenfoque de fondo (`backdrop-blur-md` en Tailwind) con bordes semitransparentes (`border-white/10`).
*   **Sombras (Glow):** En lugar de sombras negras tradicionales, usar un "glow" sutil del color del acento cuando se pasa el cursor sobre elementos interactivos (botones, portadas de discos).

## 📝 5. Reglas de Contribución y Código
1.  **Componentes Funcionales:** Utilizar exclusivamente Functional Components y React Hooks.
2.  **Tailwind CSS:** 
    *   No usar archivos CSS tradicionales. Todo el estilizado debe hacerse mediante clases utilitarias de Tailwind 4.2.
    *   Para componentes muy cargados de clases, separar la lógica usando `clsx` o `tailwind-merge` para mantener el JSX limpio.
3.  **Clean Architecture:**
    *   La UI debe ser tonta ("Dumb Components"). La lógica compleja debe residir en los `hooks` o `services`.
    *   Si un componente sobrepasa las 150 líneas, evalúa dividirlo.
4.  **Uso de Multimedia:** Asegurarse de utilizar la API nativa de HTML5 `<audio>` y `<video>` encapsulada dentro de custom hooks (ej. `usePlayerMedia`) para controlar los archivos locales `mp3` y `mp4`.
5.  **Dependencias Controladas:** Evitar librerías innecesarias (ej. sliders, carruseles) si se pueden hacer nativamente. Se permiten dependencias específicas (como `jsmediatags`) si mejoran drásticamente la experiencia visual (ej. leer portadas nativas).
6.  **Idioma del Código:** Todas las funciones, variables y comentarios deben escribirse en **español** para mantener la consistencia en el equipo.
7.  **Manejo de Rutas:** El enrutamiento debe manejarse de forma centralizada utilizando una librería estándar (ej. `react-router-dom`), definiendo las rutas dentro del módulo correspondiente (carpeta `router/` en cada feature) y exportándolas al enrutador principal.
8.  **Persistencia de Datos (Local Storage):** Cualquier interacción con `localStorage` debe abstraerse dentro de un custom hook o un servicio para no contaminar la capa visual. Las claves (keys) deben tener un prefijo claro (ej. `reproductor_volumen`) para evitar colisiones.