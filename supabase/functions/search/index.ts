import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const ch = corsHeaders(req);

  const supabase = getSupabaseAdmin();

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "Mínimo 2 caracteres" }),
        { status: 400, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    const sanitized = q.replace(/[^\w\sáéíóúñüäëïö]/gi, "").trim();
    if (!sanitized) {
      return new Response(
        JSON.stringify({ success: false, error: "Consulta inválida" }),
        { status: 400, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    const query = sanitized.split(/\s+/).map(w => w + ":*").join(" & ");

    const { data, error } = await supabase
      .from("recuerdos")
      .select("id, nombre, mensaje_largo, tipo_archivo, url_archivo, pais, region, created_at, aprobado")
      .eq("aprobado", true)
      .textSearch("buscador", query, { config: "spanish" })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data: data ?? [], total: data?.length ?? 0 }),
      { status: 200, headers: { ...ch, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...ch, "Content-Type": "application/json" } },
    );
  }
});
