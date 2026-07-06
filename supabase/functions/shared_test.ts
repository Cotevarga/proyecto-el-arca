import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { corsHeaders, handleCors } from "./_shared/cors.ts";

Deno.test("corsHeaders() returns base headers", () => {
  const req = new Request("https://elarca.cl", { headers: { origin: "https://elarca.cl" } });
  const headers = corsHeaders(req);
  assertExists(headers["Access-Control-Allow-Origin"]);
  assertExists(headers["Access-Control-Allow-Methods"]);
  assertExists(headers["Access-Control-Allow-Headers"]);
  assertEquals(headers["Content-Type"], "application/json");
});

Deno.test("handleCors() returns Response for OPTIONS", () => {
  const req = new Request("https://elarca.cl", { method: "OPTIONS" });
  const res = handleCors(req);
  assertExists(res);
  assertEquals(res.status, 200);
});

Deno.test("handleCors() returns null for non-OPTIONS", () => {
  const req = new Request("https://elarca.cl", { method: "GET" });
  const res = handleCors(req);
  assertEquals(res, null);
});

Deno.test("getClientIp() extracts IP from headers", async () => {
  const { getClientIp } = await import("./_shared/rateLimit.ts");
  const req1 = new Request("https://elarca.cl", { headers: { "x-forwarded-for": "192.168.1.1" } });
  assertEquals(getClientIp(req1), "192.168.1.1");

  const req2 = new Request("https://elarca.cl");
  assertEquals(getClientIp(req2), "unknown");
});

Deno.test("rateLimitHeaders() returns correct headers", async () => {
  const { rateLimitHeaders } = await import("./_shared/rateLimit.ts");
  const h = rateLimitHeaders(15, 30);
  assertEquals(h["x-ratelimit-limit"], "30");
  assertEquals(h["x-ratelimit-remaining"], "15");

  const h2 = rateLimitHeaders(0, 5, 900);
  assertEquals(h2["retry-after"], "900");
});
