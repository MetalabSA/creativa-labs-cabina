# 🗺️ Roadmap de Evolución: Cabina Pro & Kiosk SaaS

Este documento define la estrategia para separar la plataforma en dos productos independientes pero controlados por un centro de mando único (Master Admin).

---

## 🚀 1. Visión Estratégica
El objetivo es profesionalizar la herramienta dividiéndola en dos verticales de negocio claras:
- **App de Generación (B2C)**: Usuarios finales que compran y generan fotos (app.metalabia.com).
- **Kiosk SaaS (B2B/SAAS)**: Revendedores que crean eventos con marca blanca para sus clientes (kiosk.metalabia.com).

Todo bajo la supervisión del **Master Admin (Eagle-Eye Dashboard)**.

---

## 📦 2. Desglose de Productos

### A. App de Generación (B2C) — `app.metalabia.com`
- **Lógica**: Se mantiene 100% igual a la actual.
- **Auth**: Registro/Login obligatorio.
- **Monetización**: Venta directa de créditos vía Mercado Pago.
- **Historial**: Galería personal del usuario.
- **Control**: Se gestiona desde una pestaña exclusiva dentro del Master Admin.

### B. Modo Kiosco SaaS (B2B2C) — `kiosk.metalabia.com`
- **Enfoque**: Marca Blanca (White Label) para eventos.
- **Actores**:
    1. **Partner (Revendedor)**: Administra su negocio, compra créditos por volumen y crea eventos.
    2. **Cliente (Organizador)**: Configura el branding de su evento, descarga su QR y ve la galería en vivo.
    3. **Invitado**: Escanea el QR y usa una interfaz simplificada (Zero Friction) bajo el branding del evento.
- **Simplificación UI**: Interfaz de cámara minimalista (Selección de Estilo ➔ Aspecto ➔ Generar).

---

## 🦅 3. Jerarquía de Dashboards (El Centro de Mando)

### [Nivel 1] Master Admin (Eagle-Eye) — "Verde Neón"
- **Fusión**: Integra el admin robusto de la App B2C.
- **Métricas Globales**: Generaciones totales, ingresos, status de API/Nodos.
- **Gestión de Partners**: Crear, pausar y recargar créditos a revendedores.
- **Control Global**: Modificar estilos de IA y categorías para todos.

### [Nivel 2] Partner Dashboard (Reseller) — "Azul"
- **Marca Blanca**: Configurar logo y colores propios para SU panel y el de sus clientes.
- **Wallet**: Ver saldo de créditos mayorista y botón de compra/recarga.
- **Event Manager**: Crear y gestionar eventos para sus clientes finales.

### [Nivel 3] Event Host Dashboard (Cliente) — "Púrpura"
- **Configuración de Evento**: Nombre, fecha y mensaje de bienvenida.
- **Style Selection**: Elegir qué estilos de los permitidos por el partner estarán activos.
- **QR Center**: Descargar QR para impresión o copiar link del evento.
- **Live Gallery**: Feed en tiempo real de las fotos generadas en el evento.

---

## 🛠️ 4. Arquitectura Técnica (Multi-Entry Points)

Para mantener un mantenimiento bajo pero gran escalabilidad:
1. **Shared Core**: Carpeta `src/lib` y `src/shared` con la conexión a Supabase, lógica de créditos y procesamiento de IA.
2. **Entry Points**:
    - `index.html` ➔ Lógica de App B2C.
    - `kiosk.html` (o router `/kiosk`) ➔ Lógica SaaS de Eventos.
3. **Dashboards**: Nueva estructura en `src/components/dashboards/` con componentes React independientes para cada nivel.

---

## 📅 5. Plan de Fases (Ejecución Controlada)

### Fase 1: Cimientos y Estructura (Semana 1)
### Fase 1: Cimientos y Refactorización [COMPLETADA]
- [x] **Reestructuración de Archivos**: Creado `src/components/dashboards/` y `src/lib/core/` con lógica centralizada.
- [x] **Router Inteligente**: Implementada detección de subdominio para separar B2C de Kiosk (SaaS).
- [x] **Base de Datos**: Esquemas listos para Marca Blanca (partners, events).

### Fase 2: Master Admin "Eagle-Eye" [COMPLETADA]
- [x] **Maquetación React**: Eagle-Eye Dashboard con estética verde neón y Background3D.
- [x] **Gestión de Partners**: Interfaz para crear revendedores y asignar créditos atómicos.
- [x] **Control B2C**: Visualización de usuarios de la App principal y sus consumos.
- [x] **System Pulse**: Monitorización en tiempo real de logs y estado del engine.

### Fase 3: Núcleo SaaS (Partners & Clientes) [COMPLETADA]
- [x] **Partner Dashboard (Azul)**: Estructura de pestañas, gestión de eventos y branding propio completado.
- [x] **Wallet de Reseller**: Panel financiero con historial y balance sheet de recargas funcionando.
- [x] **Client Dashboard (Púrpura)**: Panel premium con inyección de branding dinámico (logo, color, bienvenida).
- [x] **Integración de Marca**: Lógica de herencia Partner -> Evento completamente operativa.
- [x] **Monitoreo & Acceso**: Control de créditos y generación de QR para invitados.

**Progreso Fase 3:** 100% (LISTO PARA REVISIÓN FINAL)

## 2026-02-19 (Hoy) - Finalización Fase 3
- ✅ **Panel de Cliente Premium**: Refactorización completa de `ClientDashboard.tsx` con estética premium (Framer Motion + Lucide Icons).
- ✅ **Branding Dinámico**: Implementación de lógica de herencia de marca (Partner -> Evento) para logos, colores y mensajes.
- ✅ **Monitoreo de Créditos**: Mejora visual del indicador de créditos consumidos con sistema de alertas.
- ✅ **UX de Invitados**: Generación de QR dinámico y enlace de acceso directo directo desde el panel de host.

### Fase 4: Experiencia de Invitados (Camera UI) [COMPLETADA]
- [x] **Guest Landing**: Interfaz optimizada para móviles con branding dinámico.
- [x] **Modo Kiosko**: Flujo simplificado: Elegir Estilo -> Foto -> Alquimia.
- [x] **Live Gallery**: Pantalla de proyección en tiempo real con QR de invitación.
- [x] **Sharing QR**: Generación de QR individual para descarga inmediata.

### Fase 5: Pulido y Lanzamiento [COMPLETADA]
- [x] **Optimización de Carga**: Implementado Lazy Loading y Suspense en dashboards para mejorar el LCP.
- [x] **Soporte PWA**: Configuración de `manifest.json` y meta-tags para instalación en dispositivos móviles.
- [x] **UI Polish**: Mejora de pantallas de carga ("Iniciando Experiencia Alquímica") y manejo de errores.
- [x] **Bug Fixes**: Corrección de dependencias y tipos en el dashboard de administración.
- [x] **Deploy Ready**: Configuración de subdominios lista en código (`src/index.tsx`).
- [ ] **Manual**: Manual de uso para Partners (Revendedores).

**Progreso Final**: 100% Core Funcional listo para despliegue.

## 2026-02-19 (Hoy) - Lanzamiento & Optimización
- ✅ **Performance**: Reducción del bundle inicial mediante división de código (code splitting).
- ✅ **PWA Ready**: La aplicación ya es instalable como App nativa en iOS/Android.
- ✅ **Visual Polish**: Refinamiento de la estética de carga y transiciones.

---

## 2026-02-22 (Hoy) - Mantenimiento & Estabilización de Plataforma
- ✅ **Sincronización Eagle-Eye**: Validación completa de la lógica de sincronización de Partners entre perfiles de usuario y tabla de negocio.
- ✅ **Gestión de Partners Avanzada**: Implementación del editor de socios (⚙️) con soporte para edición de contacto, razón social y desactivación de cuentas (Baja).
- ✅ **Versión Estable (v3.3.1)**: Empaquetado y build de producción verificado para despliegue en subdominios.
- ✅ **Core Resilience**: Confirmado el bypass de autenticación (JWT) para invitados en eventos, permitiendo un flujo de generación sin fricciones.

---
> 💡 **Nota**: La plataforma ha alcanzado un estado de madurez operativa alto. El foco ahora se desplaza hacia la expansión de estilos IA y optimización de costes de generación.
