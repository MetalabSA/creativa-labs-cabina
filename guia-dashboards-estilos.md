# Plan de Evolución: Dashboard Master Admin (Motor de Estilos IA)

Este documento detalla la transformación de la sección "Motor de Estilos IA" en el centro de control creativo de la plataforma.

## 1. Analíticas de Inventario Creativo
Implementar métricas superiores para el catálogo:
- **Total Estilos:** Conteo de estilos activos en el sistema.
- **Estilos Premium:** Balance de contenido exclusivo vs. gratuito/estándar.
- **Top Categoría:** Identificación de la categoría con mayor tracción.
- **Uso Promedio:** Métrica de eficiencia de los prompts actuales.

## 2. Editor Maestro de Estilos (CRUD)
Una interfaz para gestionar cada estilo en la base de datos `styles_metadata`:
- **Creación/Edición:** Formulario completo para:
    - ID del Estilo (Model ID).
    - Etiqueta amigable (Label).
    - Categoría (Cine, Videojuegos, Moda, etc.).
    - Prompt Maestro (Lo que la IA lee).
    - Flag de Premium (Toggle para restringir acceso).
- **Estado de Activación:** Activar o desactivar estilos del catálogo público sin borrarlos.

## 3. Laboratorio de Pruebas (Prompt Engineering)
- **Visualizador de Prompt:** Ver y ajustar el prompt base que define el estilo.
- **Asignación de Costos:** (Opcional) Definir si un estilo consume más créditos que otros.

## 4. Gestión de Categorías
- Organizar los estilos por grupos lógicos para que el usuario final pueda navegar mejor en la App.

---
**Objetivo Final:** Que el Master Admin sea el "Director Creativo" de la plataforma, pudiendo inyectar nuevos estilos y tendencias en tiempo real sin tocar código.
