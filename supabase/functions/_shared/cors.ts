const ALLOWED_ORIGINS_ENV = Deno.env.get("CORS_ALLOWED_ORIGINS") ?? "";
const DOMAIN = Deno.env.get("DOMAIN") ?? "elarca.cl";

const DEFAULT_ALLOWED = [
  `https://${DOMAIN}`,
  `https://www.${DOMAIN}`,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

function getAllowedOrigins(): string[] {
  if (ALLOWED_ORIGINS_ENV) {
    return ALLOWED_ORIGINS_ENV.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_ALLOWED;
}

function getOriginHeader(origin: string | null): string {
  if (origin && getAllowedOrigins().includes(origin)) {
    return origin;
  }
  return DEFAULT_ALLOWED[0];
}

const BASE_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
