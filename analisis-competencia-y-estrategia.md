# Análisis de Competencia y Estrategia: Cabina de Fotos IA vs. EventLive

Este documento es la "Brújula Estratégica" del proyecto Cabina de Fotos IA, consolidando la visión de negocio, arquitectura técnica y ventajas competitivas.

## 1. El "Unfair Advantage": IA vs. Almacenamiento
Nuestra ventaja sustancial no es guardar fotos, sino **Transformarlas**. Mientras la competencia ofrece un álbum compartido, nosotros ofrecemos una **Fábrica de Experiencias GenAI**. Elevamos el recuerdo a universos de fantasía (Marvel, Hollywood, Peaky Blinders, etc.) con calidad cinematográfica.

## 2. Puntos Fuertes del Competidor (Para Incorporar)
Para liderar el mercado de eventos, adoptamos sus estándares logísticos:
- **Zero Friction (Cero Fricción):** Acceso vía QR sin registro obligatorio para invitados.
- **Live Projection (Live Mode):** Slideshow premium en tiempo real para pantallas/proyectores.
- **Moderación Inteligente:** Filtro de contenido (IA o manual) antes de la proyección.
- **Branding Dinámico:** Adaptación de la interfaz al cliente/evento.

## 3. Arquitectura de Negocio de 3 Niveles (Escalabilidad Total)
Para soportar el crecimiento B2B y Marca Blanca, estructuramos la plataforma en tres capas independientes:

### A. Nivel 1: Master Admin (MetaLab IA)
Panel de control total para la gestión del negocio.
- **Gestión de Partners:** Creación y control de cuentas para agencias, fotógrafos y partners de Marca Blanca.
- **Control de Créditos:** Asignación de saldo a partners.
- **Métricas Globales:** Monitoreo de generaciones, tráfico y salud del sistema.

### B. Nivel 2: Host Dashboard (Partners / Organizadores)
Página independiente para el "dueño" del evento.
- **Configuración de Eventos:** Crear eventos específicos (ej: "Boda de Juan").
- **Marca Blanca (Whitelabel):** Capacidad de subir logo propio, elegir colores de UI y marcas de agua personalizadas.
- **Panel de Control:** Gestión de créditos consumidos por invitados y moderación del Live Mode.

### C. Nivel 3: Guest Experience (Invitados)
Flujo optimizado para el usuario final del evento.
- **Ingreso por QR:** Acceso instantáneo a la galería y cámara del evento específico.
- **Modo Anónimo:** Generación de imágenes sin fricción (bypass de email/auth).
- **Consumo de Créditos del Evento:** El invitado usa los créditos pre-pagados por el Host.

## 4. Oportunidades de Mercado y Marca Blanca
La **Marca Blanca** es el acelerador de crecimiento.
- **Partners Estratégicos:** Wedding Planners, Productoras de Eventos, Fotógrafos e Influencers.
- **Logística:** El partner pone el "cuerpo" (pantallas, cabina física) y nosotros ponemos el "cerebro" (IA).
- **Monetización:** Venta de créditos a partners (B2B) para que ellos los re-vendan integrados en sus servicios premium.

## 5. Hoja de Ruta de Implementación

### Fase 1: Core de Eventos y Auth Bypass
- Implementar parámetro de `event_id` en URL.
- Modificar lógica de créditos para priorizar el saldo del evento sobre el del usuario.

### Fase 2: Desacoplamiento de Dashboards
- Separar `Admin.tsx` en `MasterAdmin.tsx` y `HostDashboard.tsx`.
- Implementar rutas independientes para cada panel.

### Fase 3: Live Mode & Branding Dinámico
- Vista de proyector con Realtime Supabase.
- Sistema de variables CSS y logos dinámicos basado en la config del evento/partner.

---

## 6. Conclusión
Estamos transformando una herramienta de IA en una **Infraestructura para Eventos**. Al combinar la potencia generativa con una arquitectura Multi-Tenant y Marca Blanca, nos posicionamos no solo como un proveedor de fotos, sino como la plataforma tecnológica que potencia a toda la industria de eventos.
