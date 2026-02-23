-- Tabla para registrar el historial de carga de créditos (Wallet)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    partner_id UUID NOT NULL, -- ID del partner (user_id o id de la tabla partners)
    amount INTEGER NOT NULL,
    type TEXT DEFAULT 'top-up', -- 'top-up', 'refund', 'adjustment'
    description TEXT,
    master_admin_id UUID DEFAULT auth.uid() -- El admin que realizó la carga
);

-- Habilitar RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad
-- 1. Los Master Admins pueden hacer todo
CREATE POLICY "Master admins can manage all transactions" 
ON public.wallet_transactions 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'master' OR role = 'admin' OR is_master = true)
    )
);

-- 2. Los Partners pueden ver sus propias transacciones
CREATE POLICY "Partners can view their own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (
    partner_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.partners 
        WHERE id = wallet_transactions.partner_id AND user_id = auth.uid()
    )
);

-- Notificar recarga de esquema
NOTIFY pgrst, 'reload schema';
