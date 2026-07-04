import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = getSupabaseAdmin();

  try {
    const url = new URL(req.url);
    const method = req.method;

    // GET /galeria — public active images
    if (method === "GET") {
      const { data, error } = await supabase
        .from("galeria")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify(data ?? []), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /galeria — admin upload
    if (method === "POST") {
      const formData = await req.formData();
      const titulo = formData.get("titulo") as string ?? "";
      const descripcion = formData.get("descripcion") as string ?? "";
      const file = formData.get("archivo") as File;

      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: "Archivo requerido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({ success: false, error: "Tipo de archivo no válido. Solo JPG, PNG, WebP." }),
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
      const filePath = `galeria/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("elarca-uploads")
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("elarca-uploads")
        .getPublicUrl(filePath);

      const { data: maxOrden } = await supabase
        .from("galeria")
        .select("orden")
        .order("orden", { ascending: false })
        .limit(1);

      const nextOrden = (maxOrden?.[0]?.orden ?? 0) + 1;

      const { data, error: insertError } = await supabase
        .from("galeria")
        .insert({
          titulo,
          descripcion,
          url_imagen: publicUrl,
          storage_path: filePath,
          activo: true,
          orden: nextOrden,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true, data }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
