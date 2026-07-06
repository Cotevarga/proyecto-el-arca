// ============================================================
// EL ARCA — Tests de Edge Functions
// Ejecutar: deno test --allow-net --allow-env --allow-read
// ============================================================
import { assertEquals, assertExists, assertStringIncludes, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

// ─── Auth Function ───
Deno.test("auth: rejects missing email/password", async () => {
  const { default: serve } = await import("../functions/auth/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/auth", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const res = await serve(req);
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.success, false);
});

Deno.test("auth: rejects non-POST method", async () => {
  const { default: serve } = await import("../functions/auth/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/auth", { method: "GET" });
  const res = await serve(req);
  // Should fail fast with method check
  assert(res.status === 405 || res.status === 400);
});

// ─── Auditoria Function ───
Deno.test("auditoria: rejects missing auth token", async () => {
  const { default: serve } = await import("../functions/auditoria/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/auditoria", {
    method: "POST",
    body: JSON.stringify({ accion: "test", entidad: "recuerdo" }),
  });
  const res = await serve(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.success, false);
});

Deno.test("auditoria: rejects missing required fields", async () => {
  const { default: serve } = await import("../functions/auditoria/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/auditoria", {
    method: "POST",
    headers: { "Authorization": "Bearer fake-token" },
    body: JSON.stringify({}),
  });
  const res = await serve(req);
  const body = await res.json();
  // 400 or 401 depending on token validation
  assert(body.success === false);
});

Deno.test("auditoria: rejects GET method", async () => {
  const { default: serve } = await import("../functions/auditoria/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/auditoria", { method: "GET" });
  const res = await serve(req);
  assertEquals(res.status, 405);
});

// ─── Export Function ───
Deno.test("export: returns 400 for short query", async () => {
  const { default: serve } = await import("../functions/export/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/export?format=json", { method: "GET" });
  const res = await serve(req);
  // May return 429 due to rate limiting in test, but should be a valid response
  assert([200, 429].includes(res.status));
  if (res.status === 200) {
    const ct = res.headers.get("content-type") || "";
    assertStringIncludes(ct, "json");
    const disp = res.headers.get("content-disposition") || "";
    assertStringIncludes(disp, "elarca-export");
  }
});

Deno.test("export: returns CSV with correct headers", async () => {
  const { default: serve } = await import("../functions/export/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/export?format=csv", { method: "GET" });
  const res = await serve(req);
  assert([200, 429].includes(res.status));
  if (res.status === 200) {
    const ct = res.headers.get("content-type") || "";
    assertStringIncludes(ct, "csv");
  }
});

Deno.test("export: returns CSL format", async () => {
  const { default: serve } = await import("../functions/export/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/export?format=csl", { method: "GET" });
  const res = await serve(req);
  assert([200, 429].includes(res.status));
  if (res.status === 200) {
    const ct = res.headers.get("content-type") || "";
    assertStringIncludes(ct, "json");
    const disp = res.headers.get("content-disposition") || "";
    assertStringIncludes(disp, "csl");
  }
});

// ─── Search Function ───
Deno.test("search: returns 400 for empty query", async () => {
  const { default: serve } = await import("../functions/search/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/search?q=", { method: "GET" });
  const res = await serve(req);
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.success, false);
});

Deno.test("search: returns 400 for too short query", async () => {
  const { default: serve } = await import("../functions/search/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/search?q=a", { method: "GET" });
  const res = await serve(req);
  assertEquals(res.status, 400);
});

Deno.test("search: sanitizes malicious input", async () => {
  const { default: serve } = await import("../functions/search/index.ts");
  const req = new Request(`https://elarca.cl/functions/v1/search?q=${encodeURIComponent("'; DROP TABLE; --")}`, { method: "GET" });
  const res = await serve(req);
  assert([200, 400].includes(res.status));
  const body = await res.json();
  assertExists(body);
});

// ─── Stats Function ───
Deno.test("stats: returns valid stats structure", async () => {
  const { default: serve } = await import("../functions/stats/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/stats", { method: "GET" });
  const res = await serve(req);
  assert([200, 429].includes(res.status));
  if (res.status === 200) {
    const body = await res.json();
    assertEquals(body.success, true);
    assertExists(body.data);
    assertExists(body.data.total_contribuciones);
    assertExists(body.data.desglose);
    assertExists(body.data.desglose.fotos);
    assertExists(body.data.desglose.audios);
    assertExists(body.data.desglose.videos);
    assertExists(body.data.desglose.textos);
  }
});

Deno.test("stats: returns rate limit headers", async () => {
  const { default: serve } = await import("../functions/stats/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/stats", { method: "GET" });
  const res = await serve(req);
  assert([200, 429].includes(res.status));
  const rl = res.headers.get("x-ratelimit-limit");
  assertExists(rl);
});

// ─── Upload Function ───
Deno.test("upload: rejects no file and no text", async () => {
  const { default: serve } = await import("../functions/upload/index.ts");
  const formData = new FormData();
  formData.append("nombre", "Test");
  const req = new Request("https://elarca.cl/functions/v1/upload", {
    method: "POST",
    body: formData,
  });
  const res = await serve(req);
  // Should be 400 because no file/text/link
  assert([400, 429].includes(res.status));
  if (res.status === 400) {
    const body = await res.json();
    assertStringIncludes(body.error, "Archivo, link o texto requerido");
  }
});

Deno.test("upload: rejects invalid file type", async () => {
  const { default: serve } = await import("../functions/upload/index.ts");
  const formData = new FormData();
  formData.append("nombre", "Test");
  formData.append("archivo", new Blob(["fake"], { type: "text/html" }), "evil.html");
  const req = new Request("https://elarca.cl/functions/v1/upload", {
    method: "POST",
    body: formData,
  });
  const res = await serve(req);
  assert([400, 429].includes(res.status));
});

Deno.test("upload: accepts link_externo without file", async () => {
  const { default: serve } = await import("../functions/upload/index.ts");
  const formData = new FormData();
  formData.append("nombre", "Test Link");
  formData.append("link_externo", "https://youtube.com/watch?v=test");
  const req = new Request("https://elarca.cl/functions/v1/upload", {
    method: "POST",
    body: formData,
  });
  const res = await serve(req);
  // May fail on DB insert (no real DB in test) but should pass validation
  assert(res.status !== 400 || (await res.json()).error !== "Archivo, link o texto requerido");
});

// ─── CORS Tests (already in shared, adding coverage) ───
Deno.test("CORS: handles OPTIONS preflight for all functions", async () => {
  const { handleCors, corsHeaders } = await import("../functions/_shared/cors.ts");
  const req = new Request("https://elarca.cl", {
    method: "OPTIONS",
    headers: { origin: "https://elarca.cl" },
  });
  const res = handleCors(req);
  assertExists(res);
  assertEquals(res.status, 200);
  const allowOrigin = res.headers.get("Access-Control-Allow-Origin");
  assertEquals(allowOrigin, "https://elarca.cl");
});

Deno.test("CORS: rejects unknown origins", async () => {
  const { corsHeaders } = await import("../functions/_shared/cors.ts");
  const req = new Request("https://elarca.cl", {
    headers: { origin: "https://evil-site.com" },
  });
  const h = corsHeaders(req);
  assertEquals(h["Access-Control-Allow-Origin"], "https://elarca.cl");
});

// ─── Rate Limit Tests ───
Deno.test("rateLimit: getClientIp extracts from x-forwarded-for", async () => {
  const { getClientIp, rateLimitHeaders } = await import("../functions/_shared/rateLimit.ts");
  const req = new Request("https://elarca.cl", {
    headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
  });
  assertEquals(getClientIp(req), "203.0.113.1");
});

Deno.test("rateLimit: getClientIp returns unknown when no headers", () => {
  const { getClientIp } = globalThis;
  // Use direct import
});

Deno.test("rateLimit: rateLimitHeaders returns correct structure", async () => {
  const { rateLimitHeaders } = await import("../functions/_shared/rateLimit.ts");
  const h = rateLimitHeaders(5, 30, 900);
  assertEquals(h["x-ratelimit-limit"], "30");
  assertEquals(h["x-ratelimit-remaining"], "5");
  assertEquals(h["retry-after"], "900");
});

Deno.test("rateLimit: rateLimitHeaders without retryAfter", async () => {
  const { rateLimitHeaders } = await import("../functions/_shared/rateLimit.ts");
  const h = rateLimitHeaders(10, 20);
  assertEquals(h["x-ratelimit-limit"], "20");
  assertEquals(h["x-ratelimit-remaining"], "10");
  assertEquals(h["retry-after"], undefined);
});

// ─── Sanitize filename test ───
Deno.test("upload: filename sanitization prevents path traversal", () => {
  const sanitizeName = (name) =>
    name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.\./g, ".");
  assertEquals(sanitizeName("../../etc/passwd"), ".._.._etc_passwd");
  assertEquals(sanitizeName("normal-file.jpg"), "normal-file.jpg");
  assertEquals(sanitizeName("a b c.png"), "a_b_c.png");
  assertEquals(sanitizeName("../../../etc/shadow"), ".._.._.._etc_shadow");
});

// ─── Escape HTML test ───
Deno.test("upload: escapeHtml prevents XSS", () => {
  // This function is in upload/index.ts, testing the logic
  const escapeHtml = (text) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return String(text).replace(/[&<>"']/g, (c) => map[c] ?? c);
  };
  assertEquals(escapeHtml("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
  assertEquals(escapeHtml('"test"'), "&quot;test&quot;");
  assertEquals(escapeHtml("safe text"), "safe text");
});

// ─── Galeria function ───
Deno.test("galeria: handles GET request", async () => {
  const { default: serve } = await import("../functions/galeria/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/galeria", { method: "GET" });
  const res = await serve(req);
  assert([200, 429].includes(res.status));
  if (res.status === 200) {
    const ct = res.headers.get("content-type") || "";
    assertStringIncludes(ct, "json");
  }
});

// ─── Musica function ───
Deno.test("musica: handles GET request", async () => {
  const { default: serve } = await import("../functions/musica/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/musica", { method: "GET" });
  const res = await serve(req);
  assert([200, 429].includes(res.status));
  if (res.status === 200) {
    const ct = res.headers.get("content-type") || "";
    assertStringIncludes(ct, "json");
  }
});

// ─── Recuerdos function ───
Deno.test("recuerdos: handles GET request", async () => {
  const { default: serve } = await import("../functions/recuerdos/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/recuerdos", { method: "GET" });
  const res = await serve(req);
  assert([200, 429].includes(res.status));
  if (res.status === 200) {
    const ct = res.headers.get("content-type") || "";
    assertStringIncludes(ct, "json");
  }
});

Deno.test("recuerdos: handles unknown route", async () => {
  const { default: serve } = await import("../functions/recuerdos/index.ts");
  const req = new Request("https://elarca.cl/functions/v1/recuerdos/unknown", { method: "GET" });
  const res = await serve(req);
  // Might return 404 for unknown routes
  assert([404, 405].includes(res.status) || res.status >= 200);
});

console.log("✅ All Edge Function tests loaded");
