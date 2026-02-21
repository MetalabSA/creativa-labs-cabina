-- 1. Asegurar que la tabla styles_metadata tenga todas las columnas necesarias
-- Si no existe, se crea. Si ya existe, se agregan las columnas faltantes.

DO $$ 
BEGIN
    -- Crear la tabla si no existe
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'styles_metadata') THEN
        CREATE TABLE public.styles_metadata (
            id TEXT PRIMARY KEY,
            label TEXT,
            category TEXT,
            subcategory TEXT,
            image_url TEXT,
            tags TEXT[] DEFAULT '{}',
            is_premium BOOLEAN DEFAULT FALSE,
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;

    -- Agregar columnas una por una por si la tabla ya existía pero estaba incompleta
    IF NOT EXISTS (SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = 'styles_metadata' AND column_name = 'label') THEN
        ALTER TABLE public.styles_metadata ADD COLUMN label TEXT;
    END IF;

    IF NOT EXISTS (SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = 'styles_metadata' AND column_name = 'category') THEN
        ALTER TABLE public.styles_metadata ADD COLUMN category TEXT;
    END IF;

    IF NOT EXISTS (SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = 'styles_metadata' AND column_name = 'subcategory') THEN
        ALTER TABLE public.styles_metadata ADD COLUMN subcategory TEXT;
    END IF;

    IF NOT EXISTS (SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = 'styles_metadata' AND column_name = 'image_url') THEN
        ALTER TABLE public.styles_metadata ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = 'styles_metadata' AND column_name = 'tags') THEN
        ALTER TABLE public.styles_metadata ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = 'styles_metadata' AND column_name = 'updated_at') THEN
        ALTER TABLE public.styles_metadata ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Habilitar RLS (Seguridad)
ALTER TABLE public.styles_metadata ENABLE ROW LEVEL SECURITY;

-- 3. Políticas (Permiso total para simplificar sincronización inicial)
DROP POLICY IF EXISTS "Enable all access for styles_metadata" ON public.styles_metadata;
CREATE POLICY "Enable all access for styles_metadata" ON public.styles_metadata FOR ALL USING (true);

-- 4. RECARGAR CACHÉ DE ESQUEMA (Crítico para solucionar el error "schema cache")
-- Esto notifica a PostgREST que el esquema cambió.
NOTIFY pgrst, 'reload schema';

-- 5. Asegurar que la tabla de prompts también sea correcta
CREATE TABLE IF NOT EXISTS public.identity_prompts (
    id TEXT PRIMARY KEY,
    master_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.identity_prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for identity_prompts" ON public.identity_prompts;
CREATE POLICY "Enable all access for identity_prompts" ON public.identity_prompts FOR ALL USING (true);
