import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";
import { checkRateLimit, recordRateLimit, getClientIp, rateLimitHeaders } from "../_shared/rateLimit.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "mariajosevarga@gmail.com";

const MAX_STRING_LENGTH = 5000;
const MAX_NOMBRE_LENGTH = 200;

// ─── Magic byte signatures for allowed file types ───
const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/png": [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  "audio/mpeg": [
    new Uint8Array([0x49, 0x44, 0x33]),
    new Uint8Array([0xFF, 0xFB]),
    new Uint8Array([0xFF, 0xF3]),
    new Uint8Array([0xFF, 0xF2]),
  ],
  "audio/wav": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  "video/mp4": [new Uint8Array([0x00, 0x00, 0x00])],
  "application/pdf": [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
};

function matchesMagicByte(fileBytes: Uint8Array, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true;
  return signatures.some(sig => {
    if (fileBytes.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) {
      if (fileBytes[i] !== sig[i]) return false;
    }
    return true;
  });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (c) => map[c] ?? c);
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const ch = corsHeaders(req);

  const clientIp = getClientIp(req);

  try {
    // ─── Verify env vars ───
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl) throw new Error("SUPABASE_URL no configurada");
    if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurada");

    const supabase = getSupabaseAdmin();

    // ─── Rate limiting ───
    const rl = await checkRateLimit(clientIp, "upload");
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: "Demasiadas solicitudes. Intenta en 15 minutos." }),
        { status: 429, headers: { ...ch, "Content-Type": "application/json", ...rateLimitHeaders(rl.remaining, 5, rl.retryAfter) } },
      );
    }

    const formData = await req.formData();

    // ─── Honeypot check ───
    const honeypot = formData.get("website") as string;
    if (honeypot) {
      return new Response(
        JSON.stringify({ success: false, error: "Solicitud rechazada." }),
        { status: 400, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    const file = formData.get("archivo") as File | null;
    const nombre = ((formData.get("nombre") as string)?.trim() || "Anónimo").slice(0, MAX_NOMBRE_LENGTH);
    const mensaje_largo = (formData.get("mensaje_largo") as string)?.slice(0, MAX_STRING_LENGTH * 4) ?? null;
    const texto = (formData.get("texto") as string)?.slice(0, MAX_STRING_LENGTH * 4) ?? null;
    const categoria = (formData.get("categoria") as string || "galeria").slice(0, 100);
    const seccion = (formData.get("seccion") as string)?.slice(0, 100) ?? null;
    const pais = (formData.get("pais") as string)?.slice(0, 100) ?? null;
    const linkExterno = (formData.get("link_externo") as string)?.trim() ?? null;

    if ((!file || file.size === 0) && !linkExterno && !mensaje_largo && !texto) {
      return new Response(
        JSON.stringify({ success: false, error: "Archivo, link o texto requerido" }),
        { status: 400, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    // ─── File validation ───
    if (file && file.size > 0) {
      const validTypes = [
        "image/jpeg", "image/png", "image/webp",
        "audio/mpeg", "audio/wav",
        "video/mp4", "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({ success: false, error: "Tipo de archivo no v\u00e1lido." }),
          { status: 400, headers: { ...ch, "Content-Type": "application/json" } },
        );
      }

      if (file.size > 50 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ success: false, error: "El archivo supera los 50 MB." }),
          { status: 400, headers: { ...ch, "Content-Type": "application/json" } },
        );
      }

      // ─── Magic byte validation ───
      const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      if (!matchesMagicByte(headerBytes, file.type)) {
        console.warn(`[Upload] Magic byte mismatch: declared=${file.type}, firstBytes=${Array.from(headerBytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        try {
          await supabase.from("audit_log").insert({
            accion: "security_file_rejected",
            entidad: "upload",
            metadata: {
              reason: "magic_byte_mismatch",
              declared_type: file.type,
              first_bytes: Array.from(headerBytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '),
              filename: file.name,
              size: file.size,
            },
          });
        } catch (_) { /* audit best-effort */ }
        return new Response(
          JSON.stringify({ success: false, error: "El archivo no coincide con el tipo declarado." }),
          { status: 400, headers: { ...ch, "Content-Type": "application/json" } },
        );
      }
    }

    // ─── Sanitize filename ───
    const sanitizeName = (name: string) =>
      name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.\./g, ".");

    let urlArchivo = null;
    let storagePath = null;
    let tipoArchivo = null;
    let nombreOriginal = null;
    let tamanioBytes = null;

    if (file && file.size > 0) {
      nombreOriginal = file.name;
      tamanioBytes = file.size;
      tipoArchivo = file.type;
      const sanitized = sanitizeName(file.name);
      storagePath = `recuerdos/${Date.now()}_${sanitized}`;

      console.log(`[Upload] Subiendo archivo a storage: ${storagePath} (${file.type}, ${file.size} bytes)`);
      const { error: uploadError } = await supabase.storage
        .from("elarca-uploads")
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) {
        console.error(`[Upload] Error en storage.upload:`, JSON.stringify(uploadError));
        throw new Error(`Error al subir archivo al bucket: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("elarca-uploads")
        .getPublicUrl(storagePath);

      urlArchivo = publicUrl;
      console.log(`[Upload] Archivo subido exitosamente: ${publicUrl}`);
    } else if (linkExterno) {
      urlArchivo = linkExterno;
      tipoArchivo = "link";
    }

    const geolocalizacionRaw = (formData.get("geolocalizacion") as string)?.trim() ?? null;
    const geoParts: string[] = [];
    if (pais) geoParts.push(pais);
    if (geolocalizacionRaw) geoParts.push(geolocalizacionRaw);
    const geolocalizacionFinal = geoParts.length > 0 ? geoParts.join(", ") : null;

    const insertPayload = {
      nombre,
      mensaje_largo,
      contenido: texto || mensaje_largo,
      categoria,
      url_archivo: urlArchivo,
      storage_path: storagePath,
      tipo_archivo: tipoArchivo,
      nombre_original: nombreOriginal,
      tamanio_bytes: tamanioBytes,
      seccion,
      pais,
      geolocalizacion: geolocalizacionFinal,
      aprobado: false,
    };

    console.log(`[Upload] Insertando en recuerdos:`, JSON.stringify(insertPayload));
    const { data: inserted, error: insertError } = await supabase
      .from("recuerdos")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error(`[Upload] Error en insert:`, JSON.stringify(insertError));
      throw new Error(`Error al insertar en recuerdos: ${insertError.message}${insertError.details ? " — " + insertError.details : ""}`);
    }

    // ─── Register rate limit ───
    await recordRateLimit(clientIp, "upload_recuerdo");

    // ─── Send email notification via Resend ───
    if (RESEND_API_KEY) {
      try {
        const emailHtml = `
          <h2>Nuevo recuerdo recibido en El Arca</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          ${texto ? `<p><strong>Texto:</strong> ${escapeHtml(texto)}</p>` : ""}
          ${nombreOriginal ? `<p><strong>Archivo:</strong> ${escapeHtml(nombreOriginal)} (${(tamanioBytes! / 1024 / 1024).toFixed(1)} MB)</p>` : ""}
          <p><strong>Sección:</strong> ${escapeHtml(seccion)}</p>
          <hr>
          <p style="color:#888;">Revisa los recuerdos pendientes en el panel de administración.</p>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "El Arca <recuerdos@elarca.cl>",
            to: [ADMIN_EMAIL],
            subject: "Nuevo recuerdo pendiente de revisión",
            html: emailHtml,
          }),
        });
      } catch (emailErr) {
        console.error("[Upload] Error al enviar email:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: inserted }),
      { status: 201, headers: { ...ch, "Content-Type": "application/json", ...rateLimitHeaders(rl.remaining, 5) } },
    );
  } catch (err) {
    console.error("[Upload] Error general:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    console.error("[Upload] Error message:", err instanceof Error ? err.message : String(err));
    console.error("[Upload] Error stack:", err instanceof Error ? err.stack : "N/A");
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...ch, "Content-Type": "application/json" } },
    );
  }
});
