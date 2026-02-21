-- 1. Asegurar que la tabla styles_metadata tenga todas las columnas necesarias
CREATE TABLE IF NOT EXISTS public.styles_metadata (
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

-- 2. Por si la tabla ya existe pero le faltan columnas (que es el caso del error)
ALTER TABLE public.styles_metadata ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.styles_metadata ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.styles_metadata ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.styles_metadata ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE public.styles_metadata ADD COLUMN IF NOT EXISTS category TEXT; -- El que está fallando
ALTER TABLE public.styles_metadata ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Habilitar RLS (Seguridad)
ALTER TABLE public.styles_metadata ENABLE ROW LEVEL SECURITY;

-- 4. Políticas (Asumiendo que el admin tiene permiso total)
-- Nota: Si es para el Master Admin, solemos dejarlo abierto o con chequeo de rol.
-- Por ahora, para resolver el bloqueo inmediato:
DROP POLICY IF EXISTS "Enable all access for styles_metadata" ON public.styles_metadata;
CREATE POLICY "Enable all access for styles_metadata" ON public.styles_metadata FOR ALL USING (true);
