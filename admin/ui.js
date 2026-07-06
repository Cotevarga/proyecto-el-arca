(function() {
  'use strict';
  var A = window.__admin;

  A.showToast = function(message, type) {
    type = type || 'info';
    var container = A.dom.toastContainer;
    if (!container) return;
    var t = document.createElement('div');
    t.style.cssText = 'padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;color:white;pointer-events:auto;cursor:pointer;animation:fadeSlideUp 0.3s ease-out;box-shadow:0 8px 32px rgba(0,0,0,0.4);backdrop-filter:blur(12px);';
    var colors = { error: 'rgba(229,9,20,0.95)', success: 'rgba(46,125,50,0.95)', info: 'rgba(30,30,30,0.95)', warning: 'rgba(255,152,0,0.95)' };
    t.style.background = colors[type] || colors.info;
    t.textContent = message;
    t.onclick = function() { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; t.style.transition = '0.3s'; setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300); };
    container.appendChild(t);
    setTimeout(function() { if (t.parentNode) { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; t.style.transition = '0.3s'; setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300); } }, 5000);
  };

  A.closeReviewModal = function() {
    A.s._reviewTargetId = null;
    if (A.dom.reviewModal) A.dom.reviewModal.style.display = 'none';
  };

  A.closeEditModal = function() {
    A.s._editTargetId = null;
    if (A.dom.editModal) A.dom.editModal.style.display = 'none';
  };

  A.closeApprovalModal = function() {
    A.s._approvalTargetId = null;
    if (A.dom.approvalModal) A.dom.approvalModal.style.display = 'none';
  };

  A.closeRejectionModal = function() {
    A.s._rejectionTargetId = null;
    if (A.dom.rejectionModal) A.dom.rejectionModal.style.display = 'none';
  };

  A.toggleApprovalRelatoFields = function() {
    var val = A.dom.approvalSeccion ? A.dom.approvalSeccion.value : '';
    if (val === 'Relatos: El Jano' || val === 'Relatos: El Arca' || val === 'Relatos: Otras organizaciones' || val === 'Relatos: Anecdotas') {
      if (A.dom.approvalRelatoFields) A.dom.approvalRelatoFields.style.display = 'block';
      if (A.dom.approvalStdFields) A.dom.approvalStdFields.style.display = 'none';
    } else {
      if (A.dom.approvalRelatoFields) A.dom.approvalRelatoFields.style.display = 'none';
      if (A.dom.approvalStdFields) A.dom.approvalStdFields.style.display = 'block';
    }
  };

  A.getMusicPreviewAudio = function() {
    if (!A.s._musicPreviewAudio) {
      A.s._musicPreviewAudio = new Audio();
      A.s._musicPreviewAudio.style.display = 'none';
      document.body.appendChild(A.s._musicPreviewAudio);
    }
    return A.s._musicPreviewAudio;
  };

  A.detenerPreview = function() {
    var a = A.getMusicPreviewAudio();
    a.pause();
    a.currentTime = 0;
    a.src = '';
  };
})();
