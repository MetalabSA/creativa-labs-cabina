# Plan de Implementación: Partner Dashboard Pro 🚀

Este plan detalla la hoja de ruta para elevar el panel de Partner a un nivel profesional y orientado a la eficiencia operativa.

## Fase 1: Inteligencia de Negocio y Estado (Créditos)
**Objetivo:** Proteger la operatividad del partner mediante alertas visuales.
1.  **Indicadores Críticos:** Implementar el "Modo Alerta" en la tarjeta de Wallet.
    *   **Umbral Ambar (< 20%):** Borde brillante y texto de advertencia.
    *   **Umbral Rojo (< 10%):** Pulso de alerta e indicador de "Servicio en Riesgo".
2.  **Tooltip de Proyección:** Mostrar estimación de fotos restantes basadas en el saldo actual.

## Fase 2: El "Pulso" del Negocio (Live Feed)
**Objetivo:** Dar visibilidad inmediata de la actividad global de la cuenta.
1.  **Componente Live Feed:** En la pestaña "Overview", añadir una sección de "Últimas Capturas Globals".
2.  **Fetch Multi-Evento:** Consultar las últimas 10 fotos generadas a traves de *todos* los eventos del partner.
3.  **Transiciones Animadas:** Usar Framer Motion para que las fotos nuevas entren suavemente al feed.

## Fase 3: Eficiencia en Gestión (Bulk Actions)
**Objetivo:** Ahorrar tiempo en la moderación de galerías grandes.
1.  **Estado de Selección:** Crear un array `selectedPhotos` para trackear los IDs elegidos.
2.  **UI de Selección:** 
    *   Checkboxes elegantes en cada card de foto.
    *   Barra de acciones flotante (Action Bar) que aparece solo cuando hay fotos seleccionadas.
3.  **Acciones en Lote:**
    *   **Eliminar Seleccionadas:** Diálogo de confirmación masiva.
    *   **ZIP de Selección:** Descarga instantánea solo de lo elegido.
    *   **Select All / Deselect All.**

---
## Fase 4: Billetera & Integración Mercado Pago (PRÓXIMAMENTE) 💳
**Objetivo:** Permitir recargas de créditos autónomas y profesionales.
1.  **Top-Up Modal (Cards de Cristal):**
    *   [ ] Selector visual con 3 opciones (5.000, 10.000, 20.000 créditos).
    *   [ ] Estética de tarjetas de cristal con efectos de hover y resplandor.
2.  **Integración Mercado Pago:**
    *   [ ] Conexión con Edge Function para generar Preference ID.
    *   [ ] Implementación de Mercado Pago SDK/Modal.
3.  **Historial y Analytics:**
    *   [ ] Feed de transacciones mejorado.
    *   [ ] Gráficos de consumo por instancia.

---
**Orden de Ejecución sugerido:** 
1. Sistema de Alerta -> 2. Live Feed -> 3. Bulk Actions -> 4. Mercado Pago (Cards de Cristal).
