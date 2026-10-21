export interface UploadNotificationDetails {
  nombre: string;
  texto: string;
  nombreOriginal: string | null;
  tamanioBytes: number | null;
  seccion: string;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (character) => map[character] ?? character);
}

export function buildUploadNotificationHtml(details: UploadNotificationDetails): string {
  const { nombre, texto, nombreOriginal, tamanioBytes, seccion } = details;
  return `
          <h2>Nuevo recuerdo recibido en El Arca</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          ${texto ? `<p><strong>Texto:</strong> ${escapeHtml(texto)}</p>` : ""}
          ${nombreOriginal ? `<p><strong>Archivo:</strong> ${escapeHtml(nombreOriginal)} (${(tamanioBytes! / 1024 / 1024).toFixed(1)} MB)</p>` : ""}
          <p><strong>Sección:</strong> ${escapeHtml(seccion)}</p>
          <hr>
          <p style="color:#888;">Revisa los recuerdos pendientes en el panel de administración.</p>
        `;
}

export function sendUploadNotificationEmail(
  apiKey: string,
  adminEmail: string,
  details: UploadNotificationDetails,
  fetcher: typeof fetch = fetch,
): Promise<Response> | undefined {
  if (!apiKey) return undefined;

  return fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "El Arca <recuerdos@elarca.cl>",
      to: [adminEmail],
      subject: "Nuevo recuerdo pendiente de revisión",
      html: buildUploadNotificationHtml(details),
    }),
  });
}
