import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = getSupabaseAdmin();

  try {
    const url = new URL(req.url);
    const method = req.method;
    const pathParts = url.pathname.split("/").filter(Boolean);

    // GET /recuerdos — public approved
    if (method === "GET" && pathParts.length === 1) {
      const { data, error } = await supabase
        .from("recuerdos")
        .select("*")
        .eq("aprobado", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(data ?? []), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /recuerdos — public submission
    if (method === "POST") {
      const formData = await req.formData();
      const nombre = (formData.get("nombre") as string)?.trim();
      const anio = formData.get("anio") as string ?? null;
      const mensaje = formData.get("mensaje") as string ?? null;
      const file = formData.get("archivo") as File | null;

      if (!nombre) {
        return new Response(
          JSON.stringify({ success: false, error: "Nombre requerido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      let urlArchivo = null;
      let storagePath = null;
      let tipoArchivo = null;
      let nombreOriginal = null;
      let tamanioBytes = null;

      if (file && file.size > 0) {
        const validTypes = [
          "image/jpeg", "image/png", "image/webp",
          "audio/mpeg", "audio/wav",
          "video/mp4",
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

        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        storagePath = `recuerdos/${Date.now()}_${sanitizedName}`;
        tipoArchivo = file.type;
        nombreOriginal = file.name;
        tamanioBytes = file.size;

        const { error: uploadError } = await supabase.storage
          .from("elarca-uploads")
          .upload(storagePath, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("elarca-uploads")
          .getPublicUrl(storagePath);

        urlArchivo = publicUrl;
      }

      const { data, error: insertError } = await supabase
        .from("recuerdos")
        .insert({
          nombre,
          anio,
          mensaje,
          url_archivo: urlArchivo,
          storage_path: storagePath,
          tipo_archivo: tipoArchivo,
          nombre_original: nombreOriginal,
          tamanio_bytes: tamanioBytes,
          aprobado: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true, data }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /recuerdos/:id/aprobar — admin approve
    if (method === "PUT" && pathParts.length === 3 && pathParts[2] === "aprobar") {
      const id = pathParts[1];
      const { seccion } = await req.json();

      const { data, error } = await supabase
        .from("recuerdos")
        .update({ aprobado: true, seccion: seccion ?? "general" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /recuerdos/:id — admin delete
    if (method === "DELETE" && pathParts.length === 2) {
      const id = pathParts[1];

      const { data: existing } = await supabase
        .from("recuerdos")
        .select("storage_path")
        .eq("id", id)
        .single();

      if (existing?.storage_path) {
        await supabase.storage.from("elarca-uploads").remove([existing.storage_path]);
      }

      const { error } = await supabase.from("recuerdos").delete().eq("id", id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
