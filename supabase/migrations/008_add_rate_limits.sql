-- ===============================================================
-- EL ARCA — Rate limiting table
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id BIGSERIAL PRIMARY KEY,
    ip_address VARCHAR(64) NOT NULL,
    action VARCHAR(100) NOT NULL DEFAULT 'upload_recuerdo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_action
    ON public.rate_limits(ip_address, action, created_at DESC);

-- ─── RLS: only server-side (service_role) can write ───
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits_insert_service" ON public.rate_limits;
CREATE POLICY "rate_limits_insert_service" ON public.rate_limits
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "rate_limits_select_service" ON public.rate_limits;
CREATE POLICY "rate_limits_select_service" ON public.rate_limits
    FOR SELECT USING (true);

-- ─── Cleanup: auto-delete rows older than 24 hours ───
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
    ON public.rate_limits(created_at)
    WHERE created_at < NOW() - INTERVAL '24 hours';
