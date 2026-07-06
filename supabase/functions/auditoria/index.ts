import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";

interface AuditEntry {
  accion: string;
  entidad: string;
  entidad_id?: number | null;
  usuario_id?: number | null;
  usuario_email?: string | null;
  ip_address?: string | null;
  metadata?: Record<string, unknown> | null;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const ch = corsHeaders(req);

  const supabase = getSupabaseAdmin();

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Método no permitido" }),
        { status: 405, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    // Verificar token JWT (debe ser admin)
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "No autorizado" }),
        { status: 401, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    const body: AuditEntry = await req.json();

    if (!body.accion || !body.entidad) {
      return new Response(
        JSON.stringify({ success: false, error: "accion y entidad son requeridos" }),
        { status: 400, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    const { data, error } = await supabase
      .from("audit_log")
      .insert({
        accion: body.accion,
        entidad: body.entidad,
        entidad_id: body.entidad_id ?? null,
        usuario_id: body.usuario_id ?? null,
        usuario_email: body.usuario_email ?? user.email ?? null,
        ip_address: clientIp,
        metadata: body.metadata ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { ...ch, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...ch, "Content-Type": "application/json" } },
    );
  }
});
