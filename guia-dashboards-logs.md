# Plan de Evolución: Dashboard Master Admin (Visor de Registros / Monitor de Transacciones)

Este documento detalla la transformación de la sección "Visor de Registros" en un monitor de actividad en tiempo real del motor.

## 1. Monitor de Salud del Sistema (KPIs de Operación)
Implementar métricas de performance técnica en la parte superior:
- **Tasa de Éxito:** Porcentaje de generaciones exitosas vs. fallidas.
- **Latencia Promedio:** Tiempo estimado de procesamiento (si está disponible).
- **Consumo de Créditos:** Volumen de créditos procesados en las últimas 24hs.
- **Alertas Activas:** Indicador de errores críticos recientes.

## 2. Consola de Logs Potenciada
Evolucionar la lista de registros con:
- **Badge de Origen:** Identificar visualmente si el log viene de un Usuario B2C o de un Evento de Partner.
- **Detalle de Generación:** Ver qué estilo se usó, quién fue el usuario y a qué evento perteneció.
- **Timeline de Actividad:** Registro cronológico descendente con visualización de "hace X minutos".

## 3. Filtrado Inteligente
- **Filtro por Tipo:** Ver solo actividad B2C, solo Partners o todo.
- **Buscador Universal:** Buscar por ID de Transacción, Email de Usuario o ID de Estilo.

## 4. Visualización de Resultados
- **Quick Preview:** (Opcional) Ver una miniatura de la imagen generada directamente desde el log.

---
**Objetivo Final:** Que el Master Admin tenga una visión de "Rayos X" sobre todo lo que sucede en el motor de IA, pudiendo detectar anomalías o picos de tráfico en segundos.
