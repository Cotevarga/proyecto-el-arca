import { describe, expect, it, vi } from 'vitest';
import {
  buildUploadNotificationHtml,
  sendUploadNotificationEmail,
} from '../../../supabase/functions/_shared/uploadNotificationEmail.ts';

const details = {
  nombre: 'Vecina',
  texto: 'Recuerdo del barrio',
  nombreOriginal: 'foto.jpg',
  tamanioBytes: 1024 * 1024,
  seccion: 'El Arca',
};

describe('upload email notification', () => {
  it('escapes user content before rendering the email', () => {
    const html = buildUploadNotificationHtml({
      ...details,
      nombre: '<img src=x onerror=alert(1)>',
    });

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<img src=x');
  });

  it('sends a Resend notification with the established payload', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    await sendUploadNotificationEmail('test-key', 'admin@example.com', details, fetcher);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
    }));
    const payload = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(payload.to).toEqual(['admin@example.com']);
    expect(payload.subject).toBe('Nuevo recuerdo pendiente de revisión');
    expect(payload.html).toContain('Recuerdo del barrio');
  });

  it('does not make a request when email delivery is not configured', async () => {
    const fetcher = vi.fn();
    expect(await sendUploadNotificationEmail('', 'admin@example.com', details, fetcher)).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
