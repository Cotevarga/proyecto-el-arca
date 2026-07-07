(function() {
  'use strict';
  var A = window.__admin;

  A.logLoginAttempt = async function(email, success, errorMsg) {
    var entry = {
      accion: success ? 'login_success' : 'login_failed',
      entidad: 'admin_user',
      usuario_email: email,
      metadata: { error: errorMsg || null, user_agent: navigator.userAgent, timestamp: new Date().toISOString() }
    };
    try {
      var fnUrl = window.EDGE_FUNCTIONS_URL;
      if (A.s.token && fnUrl) {
        await fetch(fnUrl + '/auditoria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + A.s.token },
          body: JSON.stringify(entry),
        });
      }
    } catch (_) {}
    try {
      var localLog = JSON.parse(localStorage.getItem('_audit_local') || '[]');
      localLog.push({ ts: Date.now(), email: email, success: success, error: errorMsg });
      if (localLog.length > 200) localLog = localLog.slice(-200);
      localStorage.setItem('_audit_local', JSON.stringify(localLog));
    } catch (_) {}
  };

  A.showDashboard = function() {
    A.dom.loginScreen.style.display = 'none';
    A.dom.dashboardScreen.style.display = 'block';
    if (A.s.userData) {
      A.dom.userNameDisplay.textContent = A.s.userData.nombre;
      A.dom.userAvatar.textContent = A.s.userData.nombre.charAt(0).toUpperCase();
    }
    A.loadDashboard();
    setTimeout(A.iniciarRealtime, 1000);
  };

  A.loginFormSubmit = async function(e) {
    e.preventDefault();
    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;
    if (!email || !password) { A.dom.loginError.textContent = 'Completa todos los campos.'; return; }
    A.dom.loginError.textContent = '';
    A.dom.btnLogin.textContent = 'Ingresando...';
    A.dom.btnLogin.disabled = true;

    try {
      var s = await A.waitForSupabase();
      if (!s) throw new Error('Cliente Supabase no disponible');
      var { data: authData, error: authError } = await s.auth.signInWithPassword({ email: email, password: password });
      if (authError) throw new Error(authError.message);
      if (!authData.session) throw new Error('No se pudo iniciar sesión');

      A.s.token = authData.session.access_token;
      A.s.userData = {
        id: authData.user.id,
        email: authData.user.email,
        nombre: authData.user.email ? authData.user.email.split('@')[0] : 'Admin'
      };
      localStorage.setItem('admin_token', A.s.token);
      localStorage.setItem('admin_user', JSON.stringify(A.s.userData));
      await A.logLoginAttempt(email, true, null);
      A.showDashboard();
      A.showToast('Bienvenido, ' + A.s.userData.nombre, 'success');
    } catch (err) {
      await A.logLoginAttempt(email, false, err.message);
      A.dom.loginError.textContent = err.message || 'Error al conectar con el servidor.';
      var failedAttempts = parseInt(localStorage.getItem('login_failures') || '0', 10) + 1;
      localStorage.setItem('login_failures', String(failedAttempts));
      if (failedAttempts >= 5) {
        A.showToast('⚠️ Múltiples intentos fallidos detectados. Revisa el registro de seguridad.', 'error');
      }
    } finally {
      A.dom.btnLogin.textContent = 'Acceder al Panel';
      A.dom.btnLogin.disabled = false;
    }
  };

  A.logout = function(e) {
    if (e) e.preventDefault();
    if (A.detenerRealtime) A.detenerRealtime();
    A.s.token = null;
    A.s.userData = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    A.dom.loginScreen.style.display = 'flex';
    A.dom.dashboardScreen.style.display = 'none';
    A.showToast('Sesión cerrada', 'info');
  };

  A.closePwModal = function() {
    if (A.dom.pwModal) A.dom.pwModal.style.display = 'none';
    if (A.dom.pwError) A.dom.pwError.style.display = 'none';
    if (A.dom.pwCurrent) A.dom.pwCurrent.value = '';
    if (A.dom.pwNew) A.dom.pwNew.value = '';
    if (A.dom.pwConfirm) A.dom.pwConfirm.value = '';
  };

  A.showPwError = function(msg) {
    if (A.dom.pwError) { A.dom.pwError.textContent = msg; A.dom.pwError.style.display = 'block'; }
  };

  A.changePassword = async function() {
    var current = A.dom.pwCurrent ? A.dom.pwCurrent.value.trim() : '';
    var newPw = A.dom.pwNew ? A.dom.pwNew.value.trim() : '';
    var confirmPw = A.dom.pwConfirm ? A.dom.pwConfirm.value.trim() : '';

    if (!current) { A.showPwError('Ingresa tu contraseña actual.'); return; }
    if (!newPw) { A.showPwError('Ingresa la nueva contraseña.'); return; }
    if (newPw.length < 8) { A.showPwError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (newPw !== confirmPw) { A.showPwError('Las contraseñas nuevas no coinciden.'); return; }
    if (newPw === current) { A.showPwError('La nueva contraseña debe ser diferente a la actual.'); return; }

    A.dom.btnPwSave.textContent = 'Cambiando...';
    A.dom.btnPwSave.disabled = true;
    if (A.dom.pwError) A.dom.pwError.style.display = 'none';

    try {
      var s = await A.waitForSupabase();
      if (!s) throw new Error('Cliente Supabase no disponible');
      var { error: signInError } = await s.auth.signInWithPassword({ email: A.s.userData.email, password: current });
      if (signInError) throw new Error('Contraseña actual incorrecta');
      var { error: updateError } = await s.auth.updateUser({ password: newPw });
      if (updateError) throw new Error(updateError.message);
      A.showToast('Contraseña cambiada exitosamente', 'success');
      A.registrarAuditoria('password_change', 'admin_user', A.s.userData.id, {});
      A.closePwModal();
    } catch (err) {
      A.showPwError(err.message || 'Error al cambiar contraseña');
    } finally {
      A.dom.btnPwSave.textContent = '✓ CAMBIAR';
      A.dom.btnPwSave.disabled = false;
    }
  };
})();
