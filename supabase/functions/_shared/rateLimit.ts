import { getSupabaseAdmin } from "./supabase.ts";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  action: string;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  upload: { windowMs: 15 * 60 * 1000, maxRequests: 5, action: "upload_recuerdo" },
  search: { windowMs: 60 * 1000, maxRequests: 30, action: "search" },
  stats: { windowMs: 60 * 1000, maxRequests: 20, action: "stats" },
  galeria: { windowMs: 60 * 1000, maxRequests: 30, action: "galeria" },
  musica: { windowMs: 60 * 1000, maxRequests: 30, action: "musica" },
  recuerdos: { windowMs: 60 * 1000, maxRequests: 30, action: "recuerdos" },
  export: { windowMs: 60 * 1000, maxRequests: 30, action: "export" },
};

export async function checkRateLimit(
  clientIp: string,
  endpoint: string,
  customConfig?: Partial<RateLimitConfig>,
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const config = { ...(DEFAULTS[endpoint] ?? DEFAULTS.upload), ...customConfig };
  const supabase = getSupabaseAdmin();

  const since = new Date(Date.now() - config.windowMs).toISOString();

  const { count, error } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", clientIp)
    .eq("action", config.action)
    .gte("created_at", since);

  if (error) {
    console.error(`[rateLimit] Error checking ${config.action} for ${clientIp}:`, error.message);
    return { allowed: true, remaining: config.maxRequests };
  }

  const used = count ?? 0;
  const remaining = Math.max(0, config.maxRequests - used);
  const allowed = used < config.maxRequests;
  const retryAfter = allowed ? undefined : Math.ceil(config.windowMs / 1000);

  return { allowed, remaining, retryAfter };
}

export async function recordRateLimit(
  clientIp: string,
  action: string,
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("rate_limits").insert({
      ip_address: clientIp,
      action,
    });
  } catch (err) {
    console.error(`[rateLimit] Error recording ${action} for ${clientIp}:`, err);
  }
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || "unknown";
}

export function rateLimitHeaders(remaining: number, limit: number, retryAfter?: number): Record<string, string> {
  return {
    "x-ratelimit-limit": String(limit),
    "x-ratelimit-remaining": String(remaining),
    ...(retryAfter ? { "retry-after": String(retryAfter) } : {}),
  };
}
