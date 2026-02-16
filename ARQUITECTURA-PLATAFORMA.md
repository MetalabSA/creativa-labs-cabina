# 🏗️ Arquitectura de la Plataforma — Cabina de Fotos

> Documento de referencia para el desarrollo de dashboards y la estructura multi-nivel.
> Fecha: 16 de Febrero de 2026

---

## 🎯 Dos Modelos de Negocio Coexistentes

La plataforma maneja **dos flujos independientes** que coexisten en la misma app:

### Modelo A — App Pública (B2C)
> El usuario final compra sus propios créditos directamente.

```
Usuario → Descubre la app → Se registra → Compra Pack de Créditos (Mercado Pago) → Genera fotos
```

- **Quién lo maneja**: Master (Leo) al 100%
- **Monetización**: Packs de créditos (500 créditos = $XX)
- **Auth**: Obligatorio (email/Google)
- **Créditos**: Se deducen del `profiles.credits` del usuario
- **Dashboard**: El admin panel actual del Master
- **Estado**: ✅ FUNCIONANDO EN PRODUCCIÓN

### Modelo B — Evento / Marca Blanca (B2B2C)
> Un revendedor contrata el servicio para los eventos de sus clientes.

```
Revendedor → Compra créditos al Master → Crea evento para su cliente → 
Cliente configura su evento → Invitados generan fotos (sin login)
```

- **Quién lo maneja**: 3 niveles (Master → Revendedor → Cliente final)
- **Monetización**: Venta de paquetes de créditos a revendedores
- **Auth**: NO requerido para invitados (Zero Friction)
- **Créditos**: Se deducen del `events.credits_allocated` (atómico)
- **Dashboard**: 3 dashboards diferenciados (ver abajo)
- **Estado**: 🟡 FASE 1 EN DESARROLLO

---

## 🦅 Los 3 Niveles del Modelo B

### Nivel 1 — MASTER (Leo)
> "Visión de águila" — Ve y controla TODO

| Función | Descripción |
|---------|-------------|
| Ver TODOS los partners/revendedores | Listado completo, stats de facturación |
| Ver TODOS los eventos globalmente | Créditos usados, fotos generadas, estado |
| Controlar la app y sus versiones | Estilos, modelos IA, configuración global |
| Crear partners/revendedores | Onboarding de nuevos revendedores |
| Eventos propios | Crear eventos directos sin revendedor |
| Gestionar la app pública (Modelo A) | Usuarios, créditos, packs, todo lo B2C |
| Reportes globales | Ingresos, uso, tendencias |

### Nivel 2 — REVENDEDOR (Marca Blanca)
> Agencia/empresa que usa la tecnología bajo su propia marca

| Función | Descripción |
|---------|-------------|
| Panel con SU marca | Logo, colores propios |
| Crear eventos para sus clientes | Quinceañeros, corporativos, bodas |
| Comprar/asignar créditos | Compra paquetes al Master, los distribuye |
| Ver stats de SUS eventos únicamente | Solo los de su cartera |
| Gestionar clientes finales | Crear accesos para el "papá del cumple" |

### Nivel 3 — CLIENTE FINAL
> El papá del quinceañero, el organizador de la fiesta

| Función | Descripción |
|---------|-------------|
| Configurar SU evento | Nombre, fecha, logo del evento, colores |
| Elegir estilos disponibles | De los habilitados en su paquete |
| Ver/descargar QR | Para imprimir y poner en las mesas |
| Ver galería de fotos | Las fotos generadas en su evento |
| **NO ve** otros eventos | Acceso limitado solo a lo suyo |

### Nivel 4 — INVITADO (sin cuenta)
> El que escanea el QR en el evento

| Función | Descripción |
|---------|-------------|
| Elegir estilo | De los disponibles para ese evento |
| Tomar foto y generar | Flujo completo sin login |
| Descargar/compartir | Su foto generada |
| **NO tiene cuenta** | Zero Friction |

---

## 🗄️ Estructura de Base de Datos

### Tablas existentes (ya en producción)

```sql
-- Usuarios (auth + perfil)
profiles
├── id (uuid, FK → auth.users)
├── email
├── credits (int) ← Modelo A: créditos personales
├── total_generations (int)
├── is_master (boolean) ← Leo = true
└── referral_code, referred_by, etc.

-- Revendedores / Partners
partners
├── id (uuid, PK)
├── business_name (text)
├── contact_email (text)
├── contact_name (text)
└── created_at

-- Eventos
events
├── id (uuid, PK)
├── partner_id (uuid, FK → partners)
├── event_name (text)
├── event_slug (text, UNIQUE) ← URL: ?event=slug
├── config (jsonb) ← {logo_url, primary_color, welcome_text}
├── selected_styles (text[]) ← estilos habilitados
├── credits_allocated (int) ← créditos comprados
├── credits_used (int) ← créditos consumidos
├── start_date (timestamptz)
├── end_date (timestamptz)
└── created_at

-- Generaciones
generations
├── id (uuid, PK)
├── user_id (uuid, NULLABLE, FK → profiles)
├── event_id (uuid, NULLABLE, FK → events)
├── style_id (text)
├── image_url (text)
├── aspect_ratio (text)
└── created_at
```

### Columnas a agregar (futuro — Fase 2/3)

```sql
-- En profiles: rol del usuario
ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
-- Valores: 'master', 'partner', 'client', 'user'

-- En partners: datos comerciales
ALTER TABLE partners ADD COLUMN user_id uuid REFERENCES profiles(id);
-- Para vincular el partner con su cuenta de login

-- En events: datos del cliente final
ALTER TABLE events ADD COLUMN client_name text;
ALTER TABLE events ADD COLUMN client_email text;
ALTER TABLE events ADD COLUMN client_access_pin text;
-- PIN simple para que el "papá" acceda a su panel
```

---

## 🔐 Permisos por Nivel

| Tabla | Master | Revendedor | Cliente | Invitado |
|-------|--------|-----------|---------|----------|
| profiles | CRUD all | Read own | Read own | ❌ |
| partners | CRUD all | Read own | ❌ | ❌ |
| events | CRUD all | CRUD own | Read/Update own | Read (RLS) |
| generations | Read all | Read own events | Read own event | ❌ |
| api_key_pool | CRUD | ❌ | ❌ | ❌ |

---

## 📐 Flujos de la Plataforma

### Flujo Modelo A (App Pública)
```
Usuario → Login → Compra Pack (MP) → Galería → Foto → Genera → Descarga
                                                        ↓
                                            profiles.credits -= 100
```

### Flujo Modelo B (Evento)
```
Revendedor → Compra créditos al Master
           → Crea evento para cliente
           → Cliente configura evento (estilos, fechas, QR)
           → Invitado escanea QR → ?event=slug
           → Sin login → Galería filtrada → Foto → Genera
                                                      ↓
                                          events.credits_used += 1 (atómico)
```

---

## 📅 Fases de Desarrollo

### Fase 1 — Lógica del Evento ✅ / 🔄
- [x] Event Mode (Zero Friction)
- [x] Auth Bypass
- [x] Créditos atómicos
- [x] RLS public_read_events
- [ ] Filtrado de estilos por evento
- [ ] Validación de fechas
- [ ] Galería del evento

### Fase 2 — Dashboard Organizador
- [ ] Panel del Revendedor
- [ ] Creación de eventos
- [ ] Compra de créditos (MP)
- [ ] QR Generator

### Fase 3 — Dashboard Master
- [ ] Vista global de partners y eventos
- [ ] Reportes y analytics
- [ ] Gestión de APIs y modelos

---

> 💡 **Nota**: El Modelo A (app pública) sigue funcionando independientemente 
> y es gestionado 100% por el Master desde el admin panel existente.
