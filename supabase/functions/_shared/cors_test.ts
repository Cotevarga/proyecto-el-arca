import { corsHeaders, handleCors } from "./cors.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("handleCors returns Response for OPTIONS", () => {
  const req = new Request("http://localhost:8000", { method: "OPTIONS" });
  const res = handleCors(req);
  assert(res instanceof Response);
  assertEquals(res.status, 200);
});

Deno.test("handleCors returns null for GET", () => {
  const req = new Request("http://localhost:8000", { method: "GET" });
  const res = handleCors(req);
  assertEquals(res, null);
});

Deno.test("handleCors returns null for POST", () => {
  const req = new Request("http://localhost:8000", { method: "POST" });
  const res = handleCors(req);
  assertEquals(res, null);
});

Deno.test("handleCors returns null for PUT", () => {
  const req = new Request("http://localhost:8000", { method: "PUT" });
  const res = handleCors(req);
  assertEquals(res, null);
});

Deno.test("handleCors returns null for DELETE", () => {
  const req = new Request("http://localhost:8000", { method: "DELETE" });
  const res = handleCors(req);
  assertEquals(res, null);
});

Deno.test("corsHeaders includes Vary: Origin", () => {
  const req = new Request("http://localhost:8000");
  const h = corsHeaders(req);
  assertEquals(h["Vary"], "Origin");
});

Deno.test("corsHeaders includes Access-Control-Allow-Methods for OPTIONS", () => {
  const req = new Request("http://localhost:8000", { method: "OPTIONS" });
  const h = corsHeaders(req);
  assert(h["Access-Control-Allow-Methods"].includes("GET"));
  assert(h["Access-Control-Allow-Methods"].includes("POST"));
  assert(h["Access-Control-Allow-Methods"].includes("OPTIONS"));
});

Deno.test("corsHeaders returns default origin for unknown origin", () => {
  const req = new Request("http://localhost:8000", {
    headers: { "origin": "https://evil-site.com" },
  });
  const h = corsHeaders(req);
  assertEquals(h["Access-Control-Allow-Origin"], "https://elarca.cl");
});

Deno.test("corsHeaders returns localhost origin for localhost request", () => {
  const req = new Request("http://localhost:8000", {
    headers: { "origin": "http://localhost:5173" },
  });
  const h = corsHeaders(req);
  assertEquals(h["Access-Control-Allow-Origin"], "http://localhost:5173");
});

Deno.test("corsHeaders returns matching origin for allowed origin", () => {
  const req = new Request("http://localhost:8000", {
    headers: { "origin": "https://elarca.cl" },
  });
  const h = corsHeaders(req);
  assertEquals(h["Access-Control-Allow-Origin"], "https://elarca.cl");
});

Deno.test("corsHeaders returns www subdomain for www origin", () => {
  const req = new Request("http://localhost:8000", {
    headers: { "origin": "https://www.elarca.cl" },
  });
  const h = corsHeaders(req);
  assertEquals(h["Access-Control-Allow-Origin"], "https://www.elarca.cl");
});
