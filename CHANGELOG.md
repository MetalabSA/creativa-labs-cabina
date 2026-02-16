# 📋 Changelog — Creativa Labs Cabina de Fotos

---

## v3.0.0 — 16 de Febrero de 2026

### 🎟️ Event Mode — "Zero Friction" para Invitados

Se implementó el sistema completo de **Modo Evento**, permitiendo que los invitados de un evento generen fotos IA sin necesidad de crear una cuenta. Los créditos se consumen del pool del evento, no del usuario individual.

---

### ✅ Nuevas funcionalidades

#### 🔓 Auth Bypass para Invitados
- Cuando la URL contiene `?event=slug`, se omite la pantalla de login.
- Se muestra una pantalla de carga (`eventLoading`) mientras se verifica el evento.
- Los invitados acceden directamente a la galería de estilos.
- Lógica: `if (!session && !eventConfig) return <Auth />`

#### 🎟️ Créditos de Evento (Atómicos)
- **Frontend**: Verificación optimista de créditos disponibles antes de iniciar.
- **Edge Function**: Deducción atómica vía RPC `increment_event_credit(p_event_id)`.
  - Usa `UPDATE ... WHERE credits_used < credits_allocated` para prevenir race conditions.
  - Si los créditos se agotan, devuelve error claro: "🎟️ Los créditos del evento se agotaron."
- Los créditos de usuario **NO** se tocan en modo evento.
- Reembolso: solo aplica para créditos de usuario, nunca de evento.

#### 🧑‍🎨 Header Minimalista de Evento
- Para invitados sin sesión, se muestra un header glassmorphism con:
  - Logo del evento (si tiene `config.logo_url`)
  - Nombre del evento
  - Badge "Modo Evento"
  - Contador de créditos restantes en tiempo real
- Reemplaza el BubbleMenu (que solo aparece para usuarios logueados).

#### 📊 Generaciones sin Usuario
- La tabla `generations` ahora acepta `user_id` nullable (`DROP NOT NULL`).
- Cada generación de evento se vincula con `event_id` (FK a `events`).
- Permite rastrear cuántas fotos generó cada evento.

### 🗄️ Migraciones de Base de Datos

```sql
-- 1. Permitir generaciones sin usuario (invitados de evento)
ALTER TABLE public.generations ALTER COLUMN user_id DROP NOT NULL;

-- 2. Función atómica para deducir crédito de evento
CREATE OR REPLACE FUNCTION increment_event_credit(p_event_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE events
  SET credits_used = credits_used + 1
  WHERE id = p_event_id
    AND credits_used < credits_allocated;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 📐 Flujo del Invitado de Evento

```
1. QR/Link → metalab30.com/cabina?event=gp-2026
2. App detecta slug → carga evento de Supabase
3. ⚡ Bypass de login → galería de estilos directo
4. Invitado elige estilo → toma foto → genera
5. Edge Function: increment_event_credit (atómico)
6. IA genera → foto lista 🎉
7. Invitado puede descargar/compartir sin cuenta
```

### 🔧 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `App.tsx` | Auth bypass, handleSubmit con modo evento, header de evento, BubbleMenu condicional |
| `supabase/functions/cabina-vision/index.ts` | RPC `increment_event_credit`, `event_id` en insert de `generations` |
| Supabase DB | `generations.user_id` nullable, función RPC `increment_event_credit` |

### ⚙️ Estructura de la tabla `events`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `partner_id` | uuid | FK → partners |
| `event_name` | text | Nombre del evento |
| `event_slug` | text | Slug único para la URL |
| `config` | jsonb | Logo, colores, branding |
| `selected_styles` | text[] | Estilos habilitados |
| `credits_allocated` | integer | Créditos comprados |
| `credits_used` | integer | Créditos consumidos |
| `start_date` | timestamptz | Inicio del evento |
| `end_date` | timestamptz | Fin del evento |

---

## v2.0.0 — 15 de Febrero de 2026

### 🔧 Upgrade `cabina-vision` Edge Function

Se actualizó la Edge Function `cabina-vision` para replicar la lógica robusta de `futbol-vision`, adaptada al contexto de Cabina de Fotos.

---

### ✅ Nuevas funcionalidades

#### 🔄 Load Balancer (Round Robin)
- Se implementó un sistema de rotación automática de API keys de KIE.AI.
- Lee la tabla `api_key_pool` en Supabase y selecciona la llave que haga más tiempo no se usa.
- Si el pool está vacío o falla, usa la key por defecto (`BANANA_API_KEY`).
- Después de cada uso, actualiza `last_used_at` y `usage_count` de forma asincrónica.

#### 📸 Upload inteligente de selfies (Híbrido)
- **Método primario**: Uploader nativo de KIE.AI (`/api/file-base64-upload`).
  - Envía el base64 directo al servidor de KIE.AI.
  - Extracción robusta de URL: busca en múltiples campos (`url`, `fileUrl`, `imageUrl`, `link`, `src`) y recorre dinámicamente todos los campos del response buscando cualquier URL.
- **Método fallback**: Supabase Storage (bucket `user_photos`).
  - Decodifica base64, sube como binario, obtiene URL pública.
- **Safety check**: Si ambos métodos fallan, devuelve un error claro con detalles de cada fallo.

#### ⏳ Polling extendido (3 minutos)
- **Antes**: 15 intentos × 3s = 45 segundos.
- **Ahora**: 60 intentos × 3s = 180 segundos (3 minutos).
- Permite procesar imágenes complejas o de alta resolución sin timeout.

#### 💾 Persistencia de imágenes generadas
- Después de que KIE.AI genera la imagen, se **descarga y re-sube a Supabase Storage** (bucket `generations`).
- Esto garantiza URLs permanentes (las de KIE.AI son temporales y requieren auth).
- Si la persistencia falla, usa la URL original de KIE.AI como fallback.

#### 📊 Registro en base de datos
- Cada generación exitosa se registra en la tabla `generations` con:
  - `user_id`, `style_id`, `image_url`, `aspect_ratio`, `prompt`.

#### 📬 Notificaciones multicanal
- **Push Notification**: Si hay `user_id`, notifica vía `push-notification` Edge Function.
- **Email**: Si hay `email`, envía vía `send-email` Edge Function.
- **WhatsApp**: Si hay `phone`, envía vía `send-whatsapp` Edge Function.
- Todas las notificaciones son **asincrónicas** (no bloquean la respuesta).

#### ⚠️ Manejo de errores mejorado
- **402**: "Saldo insuficiente en la cuenta de IA."
- **401**: "Error de autenticación con Kie.ai."
- **500+**: Incluye el mensaje original de KIE.AI.
- **Timeout**: "La IA está tardando más de lo normal. Tu foto llegará en unos minutos."

#### 🔁 Acción `check` (Polling de rescate)
- El frontend puede enviar `action: 'check'` + `taskId` para verificar el estado de una tarea que expiró por timeout.
- Si la tarea terminó, persiste la imagen en Storage y devuelve la URL.

---

### 📝 Detalle técnico

| Aspecto | Valor |
|---------|-------|
| **Archivo** | `supabase/functions/cabina-vision/index.ts` |
| **Runtime** | Deno (Supabase Edge Functions) |
| **Project Ref** | `elesttjfwfhvzdvldytn` |
| **Modelo IA** | `nano-banana-pro` (KIE.AI) |
| **Tabla de prompts** | `identity_prompts` (distinta a `identities` de Fútbol) |
| **Tabla de keys** | `api_key_pool` |
| **Storage buckets** | `user_photos` (selfies), `generations` (resultados) |
| **Dependencias** | `@supabase/supabase-js@2.38.4`, `deno/std@0.168.0` |

---

### 🐛 Bugs resueltos durante el deploy

1. **Supabase Storage como método primario** → Falló porque el bucket `user_photos` no existía/no era público. Se cambió a KIE.AI nativo como primario.
2. **`image_input file type not supported`** → Pasaba porque la foto no se subió y se envió el base64 crudo a `image_input` (que solo acepta URLs).
3. **URL no encontrada en response de KIE upload** → El campo no era `data.url` sino otro nombre. Se implementó búsqueda dinámica en todos los campos del response.

---

### 📂 Archivos modificados

- `supabase/functions/cabina-vision/index.ts` — Edge Function principal (reescrita)
- `CHANGELOG.md` — Este archivo

### 📂 Archivos relacionados (referencia)

- `../CIRCUITO_KIE_AI.md` — Documentación completa del circuito KIE.AI para todos los verticales
- `../creativa-labs-futbol/supabase/functions/futbol-vision/index.ts` — Implementación de referencia
