(function() {
  'use strict';
  var A = window.__admin;

  A.loadSecurityEvents = async function() {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      var { data, error } = await s.from('audit_log')
        .select('*').in('accion', ['login_success', 'login_failed', 'security_file_rejected'])
        .gte('created_at', cutoff).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      var events = data || [];
      var countOk = 0, countFail = 0, countRejected = 0;
      events.forEach(function(e) {
        if (e.accion === 'login_success') countOk++;
        else if (e.accion === 'login_failed') countFail++;
        else if (e.accion === 'security_file_rejected') countRejected++;
      });

      try {
        var localLog = JSON.parse(localStorage.getItem('_audit_local') || '[]');
        localLog.forEach(function(e) { if (e.success) countOk++; else countFail++; });
        if (localLog.length > 0 && events.length < 50) {
          localLog.slice(-10).reverse().forEach(function(e) {
            events.push({ created_at: new Date(e.ts).toISOString(), accion: e.success ? 'login_success' : 'login_failed', usuario_email: e.email, metadata: { error: e.error || null, local: true } });
          });
        }
      } catch (_) {}

      if (A.dom.securityAlertBadge) {
        var totalAlerts = countFail + countRejected;
        if (totalAlerts > 0) { A.dom.securityAlertBadge.style.display = 'inline'; A.dom.securityAlertBadge.textContent = totalAlerts > 99 ? '99+' : String(totalAlerts); }
        else { A.dom.securityAlertBadge.style.display = 'none'; }
      }

      if (A.dom.secBanner && A.dom.secBannerText) {
        if (countFail + countRejected > 0) { A.dom.secBanner.style.display = 'flex'; A.dom.secBannerText.textContent = countFail + ' intentos de login fallidos · ' + countRejected + ' archivos rechazados'; }
        else { A.dom.secBanner.style.display = 'none'; }
      }

      if (A.dom.secOkCount) A.dom.secOkCount.textContent = countOk;
      if (A.dom.secFailCount) A.dom.secFailCount.textContent = countFail;
      if (A.dom.secRejectedCount) A.dom.secRejectedCount.textContent = countRejected;
      if (A.dom.securityCountBadge) A.dom.securityCountBadge.textContent = events.length + ' eventos';
      var list = A.dom.securityEventsList;
      if (!list) return;
      if (events.length === 0) { list.innerHTML = '<div class="empty-state"><div class="icon">🛡️</div><div class="text">No hay eventos de seguridad registrados</div></div>'; return; }

      var html = '<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Email / Detalle</th><th>Info adicional</th></tr></thead><tbody>';
      events.forEach(function(e) {
        var fecha = e.created_at ? new Date(e.created_at).toLocaleString('es-CL') : new Date(e.ts || Date.now()).toLocaleString('es-CL');
        var email = e.usuario_email || '—';
        var meta = e.metadata || {};
        var tipoLabel, tipoColor;
        if (e.accion === 'login_success') { tipoLabel = '✅ Acceso exitoso'; tipoColor = '#4caf50'; }
        else if (e.accion === 'login_failed') { tipoLabel = '❌ Login fallido'; tipoColor = 'var(--color-mir)'; }
        else if (e.accion === 'security_file_rejected') { tipoLabel = '🚫 Archivo rechazado'; tipoColor = '#ff9800'; }
        else { tipoLabel = e.accion; tipoColor = '#888'; }
        var detalle = '';
        if (e.accion === 'security_file_rejected') detalle = '<span style="font-size:11px;color:#999;">' + A.escapeHtml(meta.filename || '') + ' (' + A.escapeHtml(meta.declared_type || '') + ')</span>';
        else if (e.accion === 'login_failed') detalle = '<span style="font-size:11px;color:#999;">' + (meta.error ? A.escapeHtml(meta.error) : '') + '</span>';
        html += '<tr><td style="white-space:nowrap;font-size:12px;">' + fecha + '</td><td><span style="color:' + tipoColor + ';font-size:12px;font-weight:600;">' + tipoLabel + '</span></td><td style="font-size:12px;">' + A.escapeHtml(email) + '</td><td style="font-size:12px;">' + detalle + '</td></tr>';
      });
      html += '</tbody></table>';
      list.innerHTML = html;
    } catch (err) {
      console.error('[Security] Error:', err);
      if (err.message !== 'Sesión expirada') {
        var list = A.dom.securityEventsList;
        if (list && (err.code === 'PGRST116' || err.code === 'PGRST205' || (err.message && err.message.indexOf('audit_log') !== -1))) {
          list.innerHTML = '<div class="empty-state" style="border:1px dashed rgba(229,9,20,0.3);border-radius:12px;padding:32px;"><div class="icon">🗄️</div><div class="text" style="font-size:14px;color:#bbb;max-width:480px;margin:0 auto;line-height:1.6;">La tabla <code style="background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:4px;font-size:12px;">audit_log</code> no existe en la base de datos.<br><br>Para crearla, abre el <strong>SQL Editor</strong> de Supabase y ejecuta el script de migración desde <code style="background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:4px;font-size:12px;">supabase/migrations/011_audit_log.sql</code>.<br><br>Mientras tanto, los eventos de seguridad no podrán registrarse.</div></div>';
        } else { A.showToast('Error al cargar eventos de seguridad', 'error'); }
      }
    }
  };
})();
