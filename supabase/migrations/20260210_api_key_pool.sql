-- Tabla para el Pool de API Keys de KIE.AI (Load Balancer)
CREATE TABLE IF NOT EXISTS public.api_key_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key TEXT NOT NULL UNIQUE,
    account_name TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ DEFAULT now(),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.api_key_pool ENABLE ROW LEVEL SECURITY;

-- Política de Seguridad: Solo el rol de servicio puede acceder (desde Edge Functions)
CREATE POLICY "Service role only" ON public.api_key_pool
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
