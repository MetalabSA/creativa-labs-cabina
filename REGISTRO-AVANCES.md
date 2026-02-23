# 📔 Registro de Avances - Creativa Labs (Cabina de Fotos)
 
## [23-02-2026] - Refinamiento Maestro de Partners y UI

### 🛠️ Fix: Error de Esquema en Tabla Partners
- **Problema**: Al intentar dar de baja a un partner o crear uno nuevo, el sistema fallaba con el error: `COULD NOT FIND THE 'NAME' COLUMN OF 'PARTNERS'`. Esto impedía la actualización del estado `is_active` y, por ende, el filtrado correcto en el dashboard.
- **Solución**: Se eliminaron las referencias a la columna `name` en las llamadas a Supabase. Además, se refinó la lógica de baja para evitar el error `THERE IS NO UNIQUE OR EXCLUSION CONSTRAINT MATCHING THE ON CONFLICT SPECIFICATION`, delegando la acción a un `update` por ID si el registro existe, o un `insert` limpio si es un partner que solo existe en `profiles`.
- **Impacto**: Se restauró la capacidad de desactivar socios y crear nuevos. El filtro "Ver Inactivos" ahora funciona correctamente al poder persistirse el estado `is_active: false`.

### 💎 UX: Custom Confirmation Flow
- **Mejora**: Implementación de un modal de confirmación personalizado para acciones críticas (Baja de Partner y Eliminación de Eventos).
- **Diseño**: Uso de desenfoque de fondo (backdrop blur), animaciones de entrada/salida con Framer Motion y una paleta de colores de advertencia coherente con el tema oscuro/neón.
- **Resultado**: Reemplazo total de los diálogos nativos del navegador, elevando el valor percibido del panel administrativo a un estándar de producto premium.

### 💰 Billetera Real y Gestión de Créditos
- **Feature**: Implementación del historial de transacciones para Partners.
- **Base de Datos**: Creada tabla `wallet_transactions` para auditar cada carga de crédito realizada por el Master Admin.
- **Admin**: Integrado hook de grabación en `handleTopUp` para registrar el orígen y monto de cada recarga.
- **Partner Dashboard**: Reemplazados los datos de demostración por un feed real de movimientos de billetera y una visualización de consumo per-evento basada en créditos asignados vs. utilizados.

## [21-02-2026] - Resolución Crítica de Arquitectura (Timeouts y Autenticación en Edge Functions)
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
