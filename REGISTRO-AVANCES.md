# 📔 Registro de Avances - Creativa Labs (Cabina de Fotos)
 
## [21-02-2026] - Resolución Crítica de Arquitectura (Timeouts y Autenticación en Edge Functions)

### 🐛 El Asesino Silencioso de Conexiones (Gateway Timeout 504 / 500)
- **Problema**: La aplicación arrojaba el mensaje rojo `"VAR: Se perdió la conexión..."` repetidamente, algunas veces tardando 60 segundos y otras veces casi inmediatamente (< 5 segundos). Esto afectaba de forma crítica la experiencia del usuario final en la foto-cabina.
- **Raíz del Problema 1 (Timeout de 60s)**: Supabase tiene un límite estricto ("wall-time limit") en sus Edge Functions. Si Kie.ai tardaba 60 segundos o más en procesar la imagen volumétrica, el Ingress Controller de Supabase cortaba la conexión abruptamente, devolviendo un error de red al cliente.
- **Solución 1**: Se reestructuró la lógica de *Polling Interno* (el `while` en `cabina-vision/index.ts`). Se redujo el límite máximo a 45 segundos (15 intentos x 3s). Si se alcanza, la Edge Function devuelve un falso positivo (HTTP 200 con éxito parcial y el ID de tarea). El front-end detecta esto y activa su propio mecanismo asíncrono de *Modo Rescate* consultando directamente a Kie.ai.

### 🔐 El Error de los 5 segundos (JWT Bypass)
- **Problema**: Después del primer arreglo, el error empezó a suceder instantáneamente. Esto levantó bandera roja, ya que descartaba el timeout de procesamiento de la IA.
- **Investigación**: Para auditar el fallo, retiramos el escudo visual en `App.tsx` que ocultaba los errores de estado HTTP bajo la etiqueta genérica de "VAR: Se perdió la conexión". Esto expuso el error subyacente: `SUPABASE_INVOKE_ERROR: Edge Function returned a non-2xx status code`.
- **Raíz del Problema 2 (Supabase CLI Default Behavior)**: Al actualizar y redesplegar la función Edge, se utilizó el comando `supabase functions deploy`. Por diseño de Supabase CLI V1/V2, esto restablece las políticas de ejecución de la Edge Function, forzándola a requerir una cabecera de autenticación JWT vigente. Como las cabinas operan con usuarios "Anónimos" (Públicos), Supabase rechazaba la petición en su API Gateway devolviendo `HTTP 401 Unauthorized` antes siquiera de ejecutar una línea de nuestro código TypeScript (Deno).
- **Solución 2**: 
    1. Redespliegue con bandera explícita: `supabase functions deploy cabina-vision --no-verify-jwt`. Esto reabrió la "aduana" para tráfico anónimo (Crucial en módulos PWA B2C).
    2. Restauración del escudo visual (Catch block `isConnectionError`) para asegurar el reembolso asíncrono de créditos y feedback "amigable".

> 📝 **Nota de Ingeniería de Plataforma**: Siempre que agreguemos integraciones de Inteligencia Artificial que usen render farm (Kie.ai, Banana.dev, RunPod) a través de Supabase Edge Functions, el Edge debe actuar ÚNICAMENTE como *API Gateway / Broker* y jamás en un modo "sincrónico 100%" sin predecir el límite de los 60 segundos del hosting. Además, para las funciones "Guest", el bypass JWT en el despliegue es estrictamente necesario.

## [19-02-2026] - Fase 5: Pulido y Despliegue Final
- **Traducción Completa**: Localización 100% al castellano de todos los Dashboards (Admin, Partner, Cliente) y componentes de UX.
- **Lógica de Dominios (Subdomain Rerouting)**: Implementado ruteo inteligente en `src/index.tsx` para separar productos:
    - `app.metalabia.com` ➔ Carga la App B2C (Photo Booth).
    - `kiosk.metalabia.com` ➔ Carga el SaaS Management (Dashboards).
- **Refactorización de Estructura**: Movido todo el código fuente a la carpeta `src/`, incluyendo `dashboard.tsx` y `index.css`, para estandarizar el proceso de build.
- **Build & Deploy Exitoso**: 
    - Se resolvieron errores de resolución de rutas (`Could not resolve ../lib/constants`) ajustando los imports relativos.
    - Se configuró la base de la app en `/` para compatibilidad con subdominios.
    - **Push a GitHub**: ✅ Completado exitosamente.
    - **Hostinger**: Archivos subidos a `public_html/app` y `public_html/kiosk` con configuración de `.htaccess` para manejo de rutas SPA (Single Page Application).

## [19-02-2026] - Proceso Técnico y Rationale
### 🧠 Razonamiento del Ruteo
Para evitar mantener dos repositorios diferentes, usamos un **Router de Hostname** en el punto de entrada de React. El sistema detecta el subdominio y decide si renderizar la experiencia de "Cabina" o el "Dashboard de Gestión". Esto reduce la fricción en el mantenimiento de la lógica de créditos y conexión a Supabase.

### 🛠️ Resolución de Errores de Build (Post-Refactor)
Al mover los archivos a `src/`, el sistema de build (Vite) perdió la pista de los archivos de constantes. Se realizaron las siguientes correcciones:
1.  Ajuste masivo de imports: `../lib/` ➔ `../../lib/` en componentes de dashboards.
2.  Configuración de Multi-Entry Points en `vite.config.ts` para generar tanto `index.html` como `dashboard.html`.
3.  Ajuste del `manifest.json` y `favicon.png` para que usen rutas absolutas desde la raíz `/`.

## [19-02-2026] - Fase 4: Experiencia de Invitados (Camera UI)

## [19-02-2026] - Fase 3: Núcleo SaaS (Refinamiento y Dynamic Branding)
Fecha: 19 de Febrero de 2026
Estado: **Partner Dashboard Refactorizado (Premium Sync)**

### 🚀 Avances Recientes (Hoy)
#### Refactorización Integral del Partner Dashboard
- **Interfaz de Pestañas**: Implementada navegación fluida entre "Resumen", "Eventos", "Billetera" e "Identidad".
- **Sistema de Billetera (Wallet)**:
    - Nuevo Dashboard financiero para el partner con balance sheet de alta visibilidad.
    - Historial de recargas y desglose de consumo por evento.
    - Visualización de créditos disponibles vs. utilizados.
- **Gestión de Identidad (Branding)**:
    - Panel de personalización Marca Blanca: Cambio de logo corporativo, color de acento y radio de bordes.
    - Selector de Packs de Diseño IA: El partner puede elegir qué estilos habilitar para sus clientes.
- **Estética y UI/UX**:
    - Adopción del estilo "Premium Blue" con glassmorphism y efectos de profundidad.
    - Integración de `framer-motion` para transiciones de pestañas y animaciones de carga.
    - Sincronización de la barra lateral de `DashboardApp.tsx` con las nuevas vistas.
- **Correcciones Técnicas**:
    - Eliminado el término "Marca Blanca" de la UI por uno más profesional: "Identidad Visual".
    - Optimizada la carga de imágenes de muestra en el selector de estilos.

---

Este documento resume las reparaciones críticas realizadas para estabilizar la plataforma de Dashboards (Master, Partner y Client).

---

## 🛠️ Problemas Resueltos

### 1. Error de Bloqueo por 'substring' (Dashboard Negro)
- **Causa**: El sistema intentaba generar iniciales de nombres que venían nulos o vacíos (`undefined`) de la base de datos, rompiendo el renderizado de la tabla.
- **Solución**: Se implementó un "blindaje" en `Admin.tsx` y `PartnerDashboard.tsx`.
- **Cambio técnico**: Uso de `partner?.name || 'P'` y `optional chaining` en toda la lógica de mapeo de datos.

### 2. Parpadeo y Pantalla Negra (Flicker Issue)
- **Causa**: Conflictos entre los estilos globales y los estilos específicos de los Dashboards al cargar.
- **Solución**: Actualización del script anti-flicker en `dashboard.html`. Ahora espera a que Tailwind CSS esté listo antes de mostrar el `body`.
- **Mejora**: Se envolvió la app en un `ErrorBoundary` robusto (`dashboard.tsx`) para que, ante cualquier error futuro, el usuario vea un botón de "Reintentar" en lugar de una pantalla negra.

### 3. Acceso al Dashboard de Cliente (metalabia@gmail.com)
- **Causa**: Usuarios nuevos sin eventos asociados no podían entrar.
- **Solución**: Se agregó un botón de "Autoinicialización" en `ClientDashboard.tsx`.
- **Corrección de Base de Datos**: Se detectó que faltaba la columna `client_email` en la tabla `events`.
- **Acción**: Se proporcionó y ejecutó el SQL necesario para agregar:
  - `client_email`
  - `client_name`
  - `client_access_pin`

---

## 🏗️ Estado de la Sincronización (GitHub)

**IMPORTANTE**: Debido a inestabilidad en la conexión a internet, el código **NO** se pudo subir al servidor todavía.

- **Commits locales realizados**: ✅ exitosos.
- **Push a origin main**: ❌ fallido (error de resolución de host).

### Pendientes Críticos:
1.  **Subir cambios**: Ejecutar `git push origin main` cuando la conexión sea estable.
2.  **Verificar Vercel/Netlify**: Una vez hecho el push, confirmar que el build de producción se complete para limpiar el caché del navegador de los clientes.

---

## 📋 SQL de Migración (Resumen)
Para referencia futura, este fue el SQL aplicado:
```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS client_access_pin text;
CREATE INDEX IF NOT EXISTS idx_events_client_email ON events(client_email);
```

### 🗓️ 22 de Febrero 2024 - Sincronización Admin & Mejoras UI Premium

#### 🔧 Sincronización y Visibilidad (Fixes Críticos)
- **Normalización de Casing**: Implementada comparación `toLowerCase()` en `Admin.tsx` y `App.tsx` para registros de control de visibilidad. Esto garantiza que desactivar una categoría (ej: "Formula 1") funcione correctamente aunque en la DB esté como "formula 1".
- **Rescate de "Cartoon"**: Eliminada la palabra "cartoon" de la lista negra `excludeKeywords` en `Admin.tsx`. La categoría y sus estilos ahora son gestionables desde el panel.
- **Lógica Anti-Duplicados**: Agregada función `uniqueByLabel` en la App para fusionar visualmente categorías duplicadas (ej: "Cartoon" y "CARTOON") que venían de la base de datos.

#### 🎨 Interfaz de Usuario (App B2C)
- **Carrusel de Categorías Premium**: Rediseñado el filtro de estilos con un carrusel que incluye:
  - Flechas de navegación (Next/Prev) dinámicas.
  - Efectos de desvanecimiento (Fade) en los bordes para un look de alta gama.
  - Scroll suave (Smooth scrolling) y optimizado para múltiples categorías.
- **Limpieza de Menú**: Eliminado el acceso a "Dashboard Admin" desde el `BubbleMenu` de la app pública para mantener la separación de entornos y evitar confusiones del usuario final.

### 🗓️ 22 de Febrero 2026 - Confirmación de Estabilidad y Despliegue

#### ✅ Sincronización de Partners (OK)
- Se confirma que la sincronización de datos de Partners en el panel de administración está funcionando correctamente. Los registros vinculados desde `profiles` y la tabla `partners` se visualizan sin errores.

#### ⚙️ Gestión de Partners Avanzada (NUEVO)
- **Editor de Socios**: Implementado el modal de ajustes para partners (icono ⚙️).
- **Control de Datos**: Capacidad para editar Razón Social, Nombre de Contacto y Teléfono de contacto.
- **Baja de Socios**: Implementada función de "Dar de Baja" y toggle de "Estado de Cuenta" para gestionar el acceso de forma segura.
- **Estadísticas en Tiempo Real**: Sincronización de conteo de eventos y créditos directamente en la tabla de administración.

#### 📦 Empaquetado de Versión (OK)
- El proceso de build y empaquetado para despliegue está validado y operativo. La separación de entornos (`app.` y `kiosk.`) se mantiene estable tras las últimas correcciones de rutas.

---

*Documento actualizado con el feedback del usuario.*
