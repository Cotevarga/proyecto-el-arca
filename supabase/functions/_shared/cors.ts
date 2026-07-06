const ALLOWED_ORIGINS_ENV = Deno.env.get("CORS_ALLOWED_ORIGINS") ?? "";
const DOMAIN = Deno.env.get("DOMAIN") ?? "elarca.cl";

const PRODUCTION_ONLY = [
  `https://${DOMAIN}`,
  `https://www.${DOMAIN}`,
  `https://proyecto-el-arca.vercel.app`,
];

const DEV_ALLOWED = [
  ...PRODUCTION_ONLY,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

function getAllowedOrigins(): string[] {
  if (ALLOWED_ORIGINS_ENV) {
    return ALLOWED_ORIGINS_ENV.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (Deno.env.get("ENVIRONMENT") === "production") {
    return PRODUCTION_ONLY;
  }
  return DEV_ALLOWED;
}

const ENV_LABEL = Deno.env.get("ENVIRONMENT") ?? "development";

function getOriginHeader(origin: string | null): string {
  if (!origin) return `https://${DOMAIN}`;
  if (getAllowedOrigins().includes(origin)) return origin;
  if (ENV_LABEL !== "production") {
    if (origin.startsWith("http://localhost")) return origin;
  }
  return `https://${DOMAIN}`;
}

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "x-ratelimit-limit, x-ratelimit-remaining",
  "Vary": "Origin",
};

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  return {
    ...BASE_HEADERS,
    "Access-Control-Allow-Origin": getOriginHeader(origin),
    "Content-Type": "application/json",
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  return null;
}
