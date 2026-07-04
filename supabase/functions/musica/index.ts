import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = getSupabaseAdmin();

  try {
    const url = new URL(req.url);
    const method = req.method;

    // GET /musica — public active music
    if (method === "GET") {
      const { data, error } = await supabase
        .from("musica_reproductor")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify(data ?? []), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /musica — admin upload song
    if (method === "POST") {
      const formData = await req.formData();
      const titulo = (formData.get("titulo") as string)?.trim();
      const artista = (formData.get("artista") as string)?.trim() || "El Arca";
      const file = formData.get("archivo") as File;

      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: "Archivo MP3 requerido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (file.type !== "audio/mpeg" && !file.name.toLowerCase().endsWith(".mp3")) {
        return new Response(
          JSON.stringify({ success: false, error: "Formato no válido. Solo MP3." }),
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
      const filePath = `musica/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("elarca-uploads")
        .upload(filePath, file, { contentType: "audio/mpeg" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("elarca-uploads")
        .getPublicUrl(filePath);

      const { data: maxOrden } = await supabase
        .from("musica_reproductor")
        .select("orden")
        .order("orden", { ascending: false })
        .limit(1);

      const nextOrden = (maxOrden?.[0]?.orden ?? 0) + 1;

      const { data, error: insertError } = await supabase
        .from("musica_reproductor")
        .insert({
          titulo: titulo ?? sanitizedName.replace(/\.[^.]+$/, ""),
          artista,
          url_mp3: publicUrl,
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

    // PUT /musica/:id — toggle active status
    if (method === "PUT") {
      const id = url.pathname.split("/").pop();
      const { activo } = await req.json();

      const { data, error } = await supabase
        .from("musica_reproductor")
        .update({ activo })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /musica/:id
    if (method === "DELETE") {
      const id = url.pathname.split("/").pop();

      const { data: existing } = await supabase
        .from("musica_reproductor")
        .select("storage_path")
        .eq("id", id)
        .single();

      if (existing?.storage_path) {
        await supabase.storage.from("elarca-uploads").remove([existing.storage_path]);
      }

      const { error } = await supabase
        .from("musica_reproductor")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
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
