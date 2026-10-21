import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sendUploadNotificationEmail } from "./uploadNotificationEmail.ts";

Deno.test("upload notification: sends the expected Resend request", async () => {
  let requestUrl = "";
  let request: RequestInit | undefined;
  const fakeFetch: typeof fetch = async (input, init) => {
    requestUrl = String(input);
    request = init;
    return new Response(null, { status: 200 });
  };

  await sendUploadNotificationEmail("test-key", "admin@example.com", {
    nombre: "Vecina",
    texto: "Memoria comunitaria",
    nombreOriginal: "foto.jpg",
    tamanioBytes: 1024 * 1024,
    seccion: "El Arca",
  }, fakeFetch);

  assertEquals(requestUrl, "https://api.resend.com/emails");
  assertEquals(request?.method, "POST");
  assertEquals(new Headers(request?.headers).get("Authorization"), "Bearer test-key");
  const body = JSON.parse(String(request?.body));
  assertEquals(body.to, ["admin@example.com"]);
  assertStringIncludes(body.html, "Memoria comunitaria");
  assertStringIncludes(body.html, "foto.jpg (1.0 MB)");
});

Deno.test("upload notification: escapes user-supplied email content", async () => {
  let request: RequestInit | undefined;
  const fakeFetch: typeof fetch = async (_input, init) => {
    request = init;
    return new Response(null, { status: 200 });
  };

  await sendUploadNotificationEmail("test-key", "admin@example.com", {
    nombre: "<script>alert(1)</script>",
    texto: "",
    nombreOriginal: null,
    tamanioBytes: null,
    seccion: "El Arca & Memoria",
  }, fakeFetch);

  const body = JSON.parse(String(request?.body));
  assertStringIncludes(body.html, "&lt;script&gt;alert(1)&lt;/script&gt;");
  assertStringIncludes(body.html, "El Arca &amp; Memoria");
});
