import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const ch = corsHeaders(req);

  const supabase = getSupabaseAdmin();

  try {
    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";

    const { data, error } = await supabase
      .from("recuerdos")
      .select("id, nombre, anio, mensaje_largo, tipo_archivo, url_archivo, pais, region, geolocalizacion, tags, fecha_creacion_archivo, created_at")
      .eq("aprobado", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No hay datos" }),
        { status: 404, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    const items = data.map((r) => ({
      id: r.id,
      titulo: r.nombre ?? "Anónimo",
      fecha: r.anio ?? null,
      descripcion: r.mensaje_largo ?? null,
      tipo: r.tipo_archivo ?? "texto",
      url: r.url_archivo ?? null,
      pais: r.pais ?? null,
      region: r.region ?? null,
      ubicacion: r.geolocalizacion ?? null,
      etiquetas: r.tags ?? [],
      fecha_original: r.fecha_creacion_archivo ?? null,
      fecha_archivado: r.created_at,
    }));

    if (format === "csv") {
      const headers = ["id", "titulo", "fecha", "descripcion", "tipo", "url", "pais", "region", "ubicacion", "etiquetas", "fecha_original", "fecha_archivado"];
      const esc = (s: unknown) => {
        const v = String(s ?? "");
        return v.includes(",") || v.includes('"') || v.includes("\n")
          ? '"' + v.replace(/"/g, '""') + '"'
          : v;
      };
      const rows = items.map((i) =>
        headers.map((h) => esc((i as Record<string, unknown>)[h])).join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");

      return new Response(csv, {
        status: 200,
        headers: {
          ...ch,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="elarca-export.csv"',
        },
      });
    }

    if (format === "csl") {
      // CSL-JSON (Citation Style Language)
      const csl = items.map((i) => ({
        id: i.id,
        type: "document",
        title: i.titulo,
        issued: i.fecha ? { "date-parts": [[parseInt(i.fecha)]] } : undefined,
        URL: i.url ?? undefined,
        publisher: "El Arca — Archivo Comunitario",
        "publisher-place": i.ubicacion ?? i.pais ?? undefined,
        abstract: i.descripcion ?? undefined,
        categories: i.etiquetas?.length ? i.etiquetas : undefined,
      }));

      return new Response(JSON.stringify(csl, null, 2), {
        status: 200,
        headers: {
          ...ch,
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": 'attachment; filename="elarca-export.csl.json"',
        },
      });
    }

    // Default: JSON
    return new Response(JSON.stringify(items, null, 2), {
      status: 200,
      headers: {
        ...ch,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="elarca-export.json"',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...ch, "Content-Type": "application/json" } },
    );
  }
});
