import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getSupabase, getSupabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const ch = corsHeaders(req);

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, message: "Email y contraseña requeridos" }),
        { status: 400, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    const supabase = getSupabase();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      return new Response(
        JSON.stringify({ success: false, message: "Credenciales inválidas" }),
        { status: 401, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    const admin = getSupabaseAdmin();
    const { data: userData, error: userError } = await admin
      .from("admin_users")
      .select("id, email, nombre")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ success: false, message: "Usuario no encontrado" }),
        { status: 403, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        token: authData.session.access_token,
        user: {
          id: userData.id,
          email: userData.email,
          nombre: userData.nombre ?? "Admin",
        },
      }),
      { status: 200, headers: { ...ch, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: "Error interno del servidor" }),
      { status: 500, headers: { ...ch, "Content-Type": "application/json" } },
    );
  }
});
