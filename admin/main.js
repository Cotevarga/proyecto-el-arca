(function() {
  'use strict';
  var A = window.__admin;

  A.init = function() {
    A.s.ready();
    if (A.dom.loginForm) A.dom.loginForm.addEventListener('submit', A.loginFormSubmit);
    var savedToken = localStorage.getItem('admin_token');
    var savedUser = localStorage.getItem('admin_user');
    if (savedToken && savedUser) {
      A.s.token = savedToken;
      try { A.s.userData = JSON.parse(savedUser); } catch(e) { A.s.userData = null; }
      if (A.s.userData) { A.showDashboard(); return; }
    }
    A.dom.loginScreen.style.display = 'flex';
    A.dom.dashboardScreen.style.display = 'none';
  };

  // ─── Navigation sidebar ───
  var navLinks = document.querySelectorAll('.sidebar-nav a');
  navLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      navLinks.forEach(function(l) { l.classList.remove('active'); });
      this.classList.add('active');
      var section = this.getAttribute('data-section');
      document.querySelectorAll('.content-section').forEach(function(s) { s.classList.remove('active'); });
      var target = document.getElementById('section-' + section);
      if (target) target.classList.add('active');
      var titles = { dashboard: 'Dashboard', pending: 'Pendientes', approved: 'Aprobados', history: 'Historial', music: 'Gestión de Música', upload: 'Subida Manual', security: 'Centro de Seguridad' };
      if (A.dom.sectionTitle) A.dom.sectionTitle.textContent = titles[section] || 'Dashboard';
      if (section === 'pending') A.loadPending();
      if (section === 'approved') A.loadApproved();
      if (section === 'history') A.loadHistory();
      if (section === 'music') { A.actualizarListadoMusica(); A.iniciarRealtimeMusica(); }
      if (section === 'dashboard') A.loadDashboard();
      if (section === 'security') A.loadSecurityEvents();
    });
  });

  // ─── Escape key → Security ───
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !e.target.closest('input, textarea, select, [contenteditable]')) {
      var secLink = document.querySelector('.sidebar-nav a[data-section="security"]');
      if (secLink) secLink.click();
    }
  });

  // ─── Login form (registrado en A.init tras A.s.ready) ───

  // ─── Reset failure counter on saved session ───
  if (localStorage.getItem('admin_token')) { localStorage.removeItem('login_failures'); }

  // ─── Logout ───
  if (A.dom.btnLogout) A.dom.btnLogout.addEventListener('click', A.logout);
  document.querySelector('.btn-logout-dropdown')?.addEventListener('click', function() { A.logout(); });

  // ─── User dropdown ───
  if (A.dom.userBadge && A.dom.userDropdown) {
    A.dom.userBadge.addEventListener('click', function(e) {
      e.stopPropagation();
      A.dom.userDropdown.style.display = A.dom.userDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function() { if (A.dom.userDropdown) A.dom.userDropdown.style.display = 'none'; });
    A.dom.userDropdown.addEventListener('click', function(e) { e.stopPropagation(); });
  }

  // ─── Password modal ───
  if (A.dom.pwModal) A.dom.pwModal.addEventListener('click', function(e) { if (e.target === A.dom.pwModal) A.closePwModal(); });
  if (A.dom.btnPwCancel) A.dom.btnPwCancel.addEventListener('click', A.closePwModal);
  if (A.dom.btnPwSave) A.dom.btnPwSave.addEventListener('click', A.changePassword);

  // ─── Review modal ───
  if (A.dom.btnReviewClose) A.dom.btnReviewClose.addEventListener('click', A.closeReviewModal);
  if (A.dom.reviewModal) A.dom.reviewModal.addEventListener('click', function(e) { if (e.target === A.dom.reviewModal) A.closeReviewModal(); });

  // ─── Edit modal ───
  if (A.dom.btnEditCancel) A.dom.btnEditCancel.addEventListener('click', A.closeEditModal);
  if (A.dom.editModal) A.dom.editModal.addEventListener('click', function(e) { if (e.target === A.dom.editModal) A.closeEditModal(); });
  if (A.dom.btnEditSave) A.dom.btnEditSave.addEventListener('click', A.saveEdit);

  // ─── Approval modal ───
  if (A.dom.approvalSeccion) A.dom.approvalSeccion.addEventListener('change', A.toggleApprovalRelatoFields);
  if (A.dom.btnApprovalCancel) A.dom.btnApprovalCancel.addEventListener('click', A.closeApprovalModal);
  if (A.dom.approvalModal) A.dom.approvalModal.addEventListener('click', function(e) { if (e.target === A.dom.approvalModal) A.closeApprovalModal(); });
  if (A.dom.btnApprovalConfirm) A.dom.btnApprovalConfirm.addEventListener('click', A.confirmApproval);

  // ─── Rejection modal ───
  if (A.dom.btnRejectionCancel) A.dom.btnRejectionCancel.addEventListener('click', A.closeRejectionModal);
  if (A.dom.rejectionModal) A.dom.rejectionModal.addEventListener('click', function(e) { if (e.target === A.dom.rejectionModal) A.closeRejectionModal(); });
  if (A.dom.btnRejectionConfirm) A.dom.btnRejectionConfirm.addEventListener('click', A.confirmRejection);

  // ─── Music upload ───
  if (A.dom.musicUploadArea) A.dom.musicUploadArea.addEventListener('click', function() { if (A.dom.musicFileInput) A.dom.musicFileInput.click(); });
  if (A.dom.musicFileInput) {
    A.dom.musicFileInput.addEventListener('change', function() {
      var file = A.dom.musicFileInput.files ? A.dom.musicFileInput.files[0] : null;
      if (file) {
        if (file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) {
          if (A.dom.musicFileInfo) { A.dom.musicFileInfo.textContent = 'Formato no válido. Solo MP3.'; A.dom.musicFileInfo.style.color = '#E50914'; }
          A.dom.musicFileInput.value = '';
          return;
        }
        if (file.size > 50 * 1024 * 1024) {
          if (A.dom.musicFileInfo) { A.dom.musicFileInfo.textContent = 'El archivo supera los 50 MB.'; A.dom.musicFileInfo.style.color = '#E50914'; }
          A.dom.musicFileInput.value = '';
          return;
        }
        if (A.dom.musicFileInfo) { A.dom.musicFileInfo.textContent = file.name + ' (' + (file.size / 1024 / 1024).toFixed(1) + ' MB)'; A.dom.musicFileInfo.style.color = '#66bb6a'; }
        if (A.dom.musicUploadText) A.dom.musicUploadText.textContent = file.name;
      }
    });
  }
  if (A.dom.musicUploadForm) A.dom.musicUploadForm.addEventListener('submit', A.submitMusicUpload);

  // ─── Manual upload ───
  if (A.dom.adminUploadSeccion) {
    A.dom.adminUploadSeccion.addEventListener('change', function() { A.renderDynamicFields(this.value); });
    setTimeout(function() { A.renderDynamicFields(A.dom.adminUploadSeccion.value); }, 100);
  }
  if (A.dom.adminUploadForm) A.dom.adminUploadForm.addEventListener('submit', A.submitManualUpload);

  // ─── History filters ───
  setTimeout(A.setupHistoryFilters, 200);

  // ─── Boot ───
  setTimeout(A.init, 50);
})();
