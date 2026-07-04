import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "mariajosevarga@gmail.com";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = getSupabaseAdmin();

  try {
    const formData = await req.formData();
    const file = formData.get("archivo") as File | null;
    const nombre = (formData.get("nombre") as string)?.trim() || "Anónimo";
    const anio = formData.get("anio") as string ?? null;
    const mensaje = formData.get("mensaje") as string ?? null;
    const mensaje_largo = formData.get("mensaje_largo") as string ?? null;
    const categoria = formData.get("tipo_contenido") as string || "foto";
    const seccion = (formData.get("seccion") as string) || "general";
    const texto = formData.get("texto") as string ?? null;

    if ((!file || file.size === 0) && !mensaje_largo && !texto) {
      return new Response(
        JSON.stringify({ success: false, error: "Archivo o texto requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
          JSON.stringify({ success: false, error: "Tipo de archivo no válido." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (file.size > 50 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ success: false, error: "El archivo supera los 50 MB." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

      const { error: uploadError } = await supabase.storage
        .from("elarca-uploads")
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("elarca-uploads")
        .getPublicUrl(storagePath);

      urlArchivo = publicUrl;
    }

    // ─── Insert into recuerdos ───
    const { data: inserted, error: insertError } = await supabase
      .from("recuerdos")
      .insert({
        nombre,
        anio: anio ?? null,
        mensaje,
        mensaje_largo,
        categoria,
        url_archivo: urlArchivo,
        storage_path: storagePath,
        tipo_archivo: tipoArchivo,
        nombre_original: nombreOriginal,
        tamanio_bytes: tamanioBytes,
        texto,
        seccion,
        aprobado: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // ─── Send email notification via Resend ───
    if (RESEND_API_KEY) {
      try {
        const emailHtml = `
          <h2>Nuevo recuerdo recibido en El Arca</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          ${anio ? `<p><strong>Año:</strong> ${escapeHtml(anio)}</p>` : ""}
          ${mensaje ? `<p><strong>Mensaje:</strong> ${escapeHtml(mensaje)}</p>` : ""}
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
        console.error("Error al enviar email:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: inserted }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (c) => map[c] ?? c);
}
