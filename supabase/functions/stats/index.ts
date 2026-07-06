import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const ch = corsHeaders(req);

  const supabase = getSupabaseAdmin();

  try {
    const [totalRes, paisesRes, totalSizeRes] = await Promise.all([
      supabase.from("recuerdos").select("id", { count: "exact", head: true }).eq("aprobado", true),
      supabase.from("recuerdos").select("pais").eq("aprobado", true).not("pais", "is", null).neq("pais", ""),
      supabase.from("recuerdos").select("tamanio_bytes").eq("aprobado", true).not("tamanio_bytes", "is", null),
    ]);

    const total = totalRes.count ?? 0;

    const paisesUnicos = new Set(
      (paisesRes.data ?? []).map((r) => r.pais).filter(Boolean),
    );

    const totalBytes = (totalSizeRes.data ?? []).reduce(
      (acc, r) => acc + (r.tamanio_bytes ?? 0),
      0,
    );

    const [archivosRes] = await Promise.all([
      supabase.from("recuerdos").select("tipo_archivo").eq("aprobado", true),
    ]);

    const fotos = (archivosRes.data ?? []).filter((r) =>
      r.tipo_archivo?.startsWith("image")
    ).length;
    const audios = (archivosRes.data ?? []).filter((r) =>
      r.tipo_archivo?.startsWith("audio")
    ).length;
    const videos = (archivosRes.data ?? []).filter((r) =>
      r.tipo_archivo?.startsWith("video")
    ).length;
    const textos = (archivosRes.data ?? []).filter((r) =>
      !r.tipo_archivo || r.tipo_archivo === "texto" || r.tipo_archivo.startsWith("text")
    ).length;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          total_contribuciones: total,
          total_paises: paisesUnicos.size,
          paises: Array.from(paisesUnicos).sort(),
          total_gigabytes: Math.round(totalBytes / (1024 * 1024 * 1024) * 100) / 100,
          desglose: { fotos, audios, videos, textos },
        },
      }),
      { status: 200, headers: { ...ch, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...ch, "Content-Type": "application/json" } },
    );
  }
});
