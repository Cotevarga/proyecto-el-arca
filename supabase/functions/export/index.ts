import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";
import { checkRateLimit, recordRateLimit, getClientIp, rateLimitHeaders } from "../_shared/rateLimit.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const ch = corsHeaders(req);

  const supabase = getSupabaseAdmin();
  const clientIp = getClientIp(req);

  try {
    if (req.method === "GET") {
      const rl = await checkRateLimit(clientIp, "export");
      if (!rl.allowed) {
        return new Response(
          JSON.stringify({ success: false, error: "Demasiadas solicitudes." }),
          { status: 429, headers: { ...ch, "Content-Type": "application/json", ...rateLimitHeaders(rl.remaining, 30, rl.retryAfter) } },
        );
      }
      await recordRateLimit(clientIp, "export");
    }

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";

    const { data, error } = await supabase
      .from("recuerdos")
      .select("id, nombre, anio, mensaje_largo, tipo_archivo, url_archivo, geolocalizacion, tags, fecha_creacion_archivo, created_at")
      .eq("aprobado", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const items = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id, titulo: r.nombre ?? "Anónimo", fecha: r.anio ?? null,
      descripcion: r.mensaje_largo ?? null, tipo: r.tipo_archivo ?? "texto",
      url: r.url_archivo ?? null,
      ubicacion: r.geolocalizacion ?? null, etiquetas: r.tags ?? [],
      fecha_original: r.fecha_creacion_archivo ?? null, fecha_archivado: r.created_at,
    }));

    if (format === "csv") {
      const h = ["id", "titulo", "fecha", "descripcion", "tipo", "url", "ubicacion", "etiquetas", "fecha_original", "fecha_archivado"];
      const esc = (s: unknown) => { const v = String(s ?? ""); return v.includes(",") || v.includes('"') || v.includes("\n") ? '"' + v.replace(/"/g, '""') + '"' : v; };
      return new Response([h.join(","), ...items.map((i: Record<string, unknown>) => h.map((k) => esc(i[k])).join(","))].join("\n"), {
        status: 200, headers: { ...ch, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="elarca-export.csv"' },
      });
    }

    if (format === "csl") {
      return new Response(JSON.stringify(items.map((i: Record<string, unknown>) => ({
        id: i.id, type: "document", title: i.titulo,
        issued: i.fecha ? { "date-parts": [[parseInt(i.fecha as string)]] } : undefined,
        URL: i.url ?? undefined, publisher: "El Arca — Archivo Comunitario",
        "publisher-place": i.ubicacion ? String(i.ubicacion) : undefined, abstract: i.descripcion ?? undefined,
        categories: (i.etiquetas as string[])?.length ? i.etiquetas : undefined,
      })), null, 2), {
        status: 200, headers: { ...ch, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="elarca-export.csl.json"' },
      });
    }

    return new Response(JSON.stringify(items, null, 2), {
      status: 200, headers: { ...ch, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="elarca-export.json"' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...ch, "Content-Type": "application/json" } },
    );
  }
});
