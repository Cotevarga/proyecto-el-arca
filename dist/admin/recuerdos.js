(function() {
  'use strict';
  var A = window.__admin;

  A.loadPending = async function() {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var { data, error } = await s.from('recuerdos').select('*').eq('aprobado', false).order('created_at', { ascending: false });
      if (error) throw error;
      var pending = data || [];
      window._pendingRecords = pending;
      if (A.dom.pendingCount) A.dom.pendingCount.textContent = pending.length;
      var list = A.dom.pendingList;
      if (pending.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="icon">✅</div><div class="text">Todo revisado — no hay pendientes</div></div>';
        return;
      }
      var html = '<table><thead><tr><th>Vista previa</th><th>Relato</th><th>Acción</th></tr></thead><tbody>';
      pending.forEach(function(r) {
        var imgHtml = r.url_archivo
          ? '<img src="' + r.url_archivo + '" width="100" style="border-radius:8px;object-fit:cover;max-height:80px;" alt="Vista previa de ' + A.escapeHtml(r.nombre || 'recuerdo') + '">'
          : '<span style="color:#666;font-size:11px;">Archivo no disponible</span>';
        var textoRelato = r.mensaje_largo || r.mensaje || '';
        var relatoHtml = '';
        if (textoRelato) {
          var textoTruncado = textoRelato.length > 200 ? textoRelato.substring(0, 200) + '...' : textoRelato;
          relatoHtml = '<div style="max-height:100px;overflow-y:auto;font-size:12px;color:#ccc;line-height:1.5;">' + A.escapeHtml(textoTruncado) + '</div>';
          if (textoRelato.length > 200) {
            relatoHtml += '<button class="btn-ver-completo" onclick="window.verCompleto(\'' + r.id + '\')" aria-label="Ver texto completo del relato">VER COMPLETO</button>';
          }
        } else {
          relatoHtml = '<span style="color:#555;font-size:11px;">Sin relato</span>';
        }
        html += '<tr><td style="vertical-align:middle;">' + imgHtml + '</td><td style="vertical-align:middle;">' + relatoHtml + '</td><td style="vertical-align:middle;white-space:nowrap;">' +
          '<button class="btn-sm btn-sm-approve" onclick="window.approveRecuerdo(\'' + r.id + '\')" aria-label="Abrir modal de aprobación">✓ APROBAR</button> ' +
          '<button class="btn-sm btn-sm-edit" onclick="window.editRecuerdo(\'' + r.id + '\')" aria-label="Editar recuerdo">✎ Editar</button> ' +
          '<button class="btn-sm btn-sm-reject" onclick="window.rejectRecuerdo(\'' + r.id + '\')" aria-label="Eliminar recuerdo permanentemente">✕ ELIMINAR</button></td></tr>';
      });
      html += '</tbody></table>';
      list.innerHTML = html;
    } catch (err) {
      if (err.message !== 'Sesión expirada') A.showToast('Error al cargar pendientes', 'error');
    }
  };

  A.loadApproved = async function() {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var { data } = await s.from('recuerdos').select('*').eq('aprobado', true).order('created_at', { ascending: false });
      var approved = data || [];
      var list = A.dom.approvedList;
      if (approved.length === 0) { list.innerHTML = '<div class="empty-state"><div class="icon">📸</div><div class="text">No hay recuerdos aprobados</div></div>'; return; }
      var html = '<table><thead><tr><th>Nombre</th><th class="hide-mobile">Tipo</th><th class="hide-mobile">Fecha</th><th>Acción</th></tr></thead><tbody>';
      approved.forEach(function(r) {
        var fecha = r.created_at ? new Date(r.created_at).toLocaleDateString('es-CL') : '—';
        html += '<tr><td class="truncate">' + A.escapeHtml(r.nombre) + '</td><td class="hide-mobile"><span class="badge badge-approved">' + (r.tipo_archivo && r.tipo_archivo.indexOf('audio') !== -1 ? 'Audio' : 'Imagen') + '</span></td><td class="hide-mobile">' + fecha + '</td>' +
          '<td style="white-space:nowrap;"><button class="btn-sm btn-sm-edit" onclick="window.editRecuerdo(\'' + r.id + '\')" aria-label="Editar recuerdo" style="margin-right:4px;">✎ Editar</button>' +
          '<button class="btn-sm btn-sm-danger" onclick="window.rejectRecuerdo(\'' + r.id + '\')" aria-label="Eliminar recuerdo aprobado">✕ Eliminar</button></td></tr>';
      });
      html += '</tbody></table>';
      list.innerHTML = html;
    } catch (err) { if (err.message !== 'Sesión expirada') A.showToast('Error al cargar aprobados', 'error'); }
  };

  A.loadHistory = async function() {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var [recuerdosResult, auditResult] = await Promise.all([
        s.from('recuerdos').select('*').order('created_at', { ascending: false }),
        s.from('audit_log').select('*').eq('accion', 'reject').order('created_at', { ascending: false })
      ]);
      if (recuerdosResult.error) throw recuerdosResult.error;
      var records = (recuerdosResult.data || []).slice();
      if (auditResult.data && !auditResult.error) {
        auditResult.data.forEach(function(log) {
          var snap = log.metadata && log.metadata.record_snapshot;
          if (snap) {
            snap._deleted = true;
            snap._deleted_at = log.created_at;
            snap._deleted_reason = (log.metadata && log.metadata.razon) || 'Eliminado';
            if (typeof snap.id === 'string') snap.id = Number(snap.id);
            records.push(snap);
          }
        });
      }
      records.sort(function(a, b) {
        var da = a.created_at ? new Date(a.created_at).getTime() : 0;
        var db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
      A.s._historyData = records;
      if (A.dom.historyCount) A.dom.historyCount.textContent = A.s._historyData.length;
      A.renderHistoryTable(A.s._historyData);
    } catch (err) { if (err.message !== 'Sesión expirada') A.showToast('Error al cargar historial', 'error'); }
  };

  A.renderHistoryTable = function(records) {
    var list = A.dom.historyList;
    if (!list) return;
    if (records.length === 0) { list.innerHTML = '<div class="empty-state"><div class="icon">📋</div><div class="text">No hay registros</div></div>'; return; }

    var html = '<table><thead><tr><th>Fecha</th><th>Pseudónimo</th><th>Título</th><th>Sección</th><th>Estado</th><th>Acción</th></tr></thead><tbody>';
    records.forEach(function(r) {
      var fecha = r.created_at ? new Date(r.created_at).toLocaleDateString('es-CL') : '—';
      var nombre = A.escapeHtml(r.nombre || 'Anónimo');
      var titulo = A.escapeHtml(r.titulo_relato || r.nombre || '—');
      var seccionLabel = A.nombreSeccion(r.seccion);

      var estadoBadge;
      if (r._deleted) {
        var razon = r._deleted_reason || 'Eliminado';
        fecha = r._deleted_at ? new Date(r._deleted_at).toLocaleDateString('es-CL') : fecha;
        estadoBadge = '<span class="badge" style="background:rgba(229,9,20,0.12);color:#ef5350;text-decoration:line-through;">✕ ' + A.escapeHtml(razon) + '</span>';
      } else if (r.aprobado) {
        estadoBadge = '<span class="badge badge-approved">Publicado</span>';
      } else {
        estadoBadge = '<span class="badge badge-pending">Pendiente</span>';
      }

      var actionsHtml;
      if (r._deleted) {
        actionsHtml = '<span style="color:#555;font-size:11px;">Registro histórico</span>';
      } else {
        actionsHtml = '<button class="btn-sm btn-sm-edit" onclick="window.editRecuerdo(\'' + r.id + '\')" aria-label="Editar">✎ Editar</button>' +
          '<button class="btn-sm btn-sm-reject" onclick="window.rejectRecuerdo(\'' + r.id + '\')" aria-label="Eliminar" style="margin-left:4px;">✕ Eliminar</button>';
      }
      html += '<tr' + (r._deleted ? ' style="opacity:0.6;"' : '') + '><td style="white-space:nowrap;">' + fecha + '</td><td class="truncate">' + nombre + '</td><td class="truncate">' + titulo + '</td><td>' + seccionLabel + '</td><td>' + estadoBadge + '</td><td style="white-space:nowrap;">' + actionsHtml + '</td></tr>';
    });
    html += '</tbody></table>';
    list.innerHTML = html;
  };

  A.applyHistoryFilters = function() {
    var search = A.dom.historySearch;
    var filterSection = A.dom.historyFilterSection;
    var filterStatus = A.dom.historyFilterStatus;
    if (!search || !filterSection || !filterStatus) return;
    var query = (search.value || '').toLowerCase().trim();
    var sectionVal = filterSection.value;
    var statusVal = filterStatus.value;

    var filtered = A.s._historyData.filter(function(r) {
      if (sectionVal && r.seccion !== sectionVal) return false;
      if (statusVal === 'aprobado' && (r._deleted || !r.aprobado)) return false;
      if (statusVal === 'pendiente' && (r._deleted || r.aprobado)) return false;
      if (query) {
        var haystack = ((r.nombre || '') + ' ' + (r.titulo_relato || '') + ' ' + (r.mensaje_largo || r.mensaje || '') + ' ' + (r.seccion || '')).toLowerCase();
        if (haystack.indexOf(query) === -1) return false;
      }
      return true;
    });
    A.renderHistoryTable(filtered);
  };

  A.setupHistoryFilters = function() {
    var search = A.dom.historySearch;
    var filterSection = A.dom.historyFilterSection;
    var filterStatus = A.dom.historyFilterStatus;
    var _searchTimer = null;
    if (search) {
      search.addEventListener('input', function() {
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(A.applyHistoryFilters, 250);
      });
    }
    if (filterSection) filterSection.addEventListener('change', A.applyHistoryFilters);
    if (filterStatus) filterStatus.addEventListener('change', A.applyHistoryFilters);
  };

  window.verCompleto = async function(id) {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var { data, error } = await s.from('recuerdos').select('id, nombre, url_archivo, mensaje_largo, mensaje').eq('id', id).single();
      if (error) throw error;
      if (!data) return;
      A.s._reviewTargetId = id;
      if (A.dom.reviewImg) {
        A.dom.reviewImg.src = data.url_archivo || '';
        A.dom.reviewImg.style.display = data.url_archivo ? 'block' : 'none';
        if (!data.url_archivo) A.dom.reviewImg.alt = data.nombre ? 'Imagen aportada por ' + data.nombre : 'Archivo no disponible';
      }
      if (A.dom.reviewText) A.dom.reviewText.textContent = data.mensaje_largo || data.mensaje || 'Sin contenido.';
      if (A.dom.reviewModal) A.dom.reviewModal.style.display = 'flex';
    } catch (err) { A.showToast('Error al cargar detalle', 'error'); }
  };

  window.editRecuerdo = async function(id) {
    A.s._editTargetId = id;
    try {
      var s = await A.waitForSupabase();
      if (!s) { A.showToast('Cliente Supabase no disponible', 'error'); return; }
      var { data: r, error } = await s.from('recuerdos').select('*').eq('id', id).single();
      if (error) { A.showToast('Error al cargar datos', 'error'); return; }
      if (A.dom.editSeccion) A.dom.editSeccion.value = r.seccion || 'Galeria';
      if (A.dom.editNombre) A.dom.editNombre.value = r.nombre || '';
      if (A.dom.editTitulo) A.dom.editTitulo.value = r.titulo_relato || '';
      if (A.dom.editSerie) A.dom.editSerie.value = r.nombre_serie || '';
      if (A.dom.editTexto) A.dom.editTexto.value = r.mensaje_largo || r.mensaje || '';
      if (A.dom.editGeo) A.dom.editGeo.value = r.geolocalizacion || '';
      if (A.dom.editTags) A.dom.editTags.value = (r.tags && Array.isArray(r.tags)) ? r.tags.join(', ') : (r.tags || '');
      if (A.dom.editTranscripcion) A.dom.editTranscripcion.value = r.transcripcion || '';
      if (A.dom.editModal) A.dom.editModal.style.display = 'flex';
    } catch (err) { A.showToast('Error al cargar datos', 'error'); }
  };

  A.saveEdit = async function() {
    var id = A.s._editTargetId;
    if (!id) { A.closeEditModal(); return; }
    var seccion = A.dom.editSeccion ? A.dom.editSeccion.value : 'Galeria';
    var nombre = A.dom.editNombre ? A.dom.editNombre.value.trim() : '';
    var titulo = A.dom.editTitulo ? A.dom.editTitulo.value.trim() : '';
    var serie = A.dom.editSerie ? A.dom.editSerie.value.trim() : '';
    var texto = A.dom.editTexto ? A.dom.editTexto.value.trim() : '';
    var geo = A.dom.editGeo ? A.dom.editGeo.value.trim() : '';
    var tagsRaw = A.dom.editTags ? A.dom.editTags.value.trim() : '';
    var tags = tagsRaw ? tagsRaw.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t.length > 0; }) : null;
    var transcripcion = A.dom.editTranscripcion ? A.dom.editTranscripcion.value.trim() : '';

    A.dom.btnEditSave.textContent = 'Guardando...';
    A.dom.btnEditSave.disabled = true;
    try {
      var s = window.__admin.getSupabaseClient();
      if (!s) throw new Error('Cliente Supabase no disponible');
      var updateData = { seccion: seccion, nombre: nombre || null, titulo_relato: titulo || null, nombre_serie: serie || null, mensaje_largo: texto || null, geolocalizacion: geo || null, tags: tags, transcripcion: transcripcion || null };
      var { error: updateError } = await s.from('recuerdos').update(updateData).eq('id', id);
      if (updateError) throw updateError;
      A.showToast('Recuerdo actualizado', 'success');
      A.registrarAuditoria('update', 'recuerdo', id, { seccion: seccion, campos: Object.keys(updateData) });
      A.closeEditModal();
      A.loadPending();
      A.loadApproved();
      A.loadHistory();
      A.loadDashboard();
    } catch (err) { A.showToast('Error al guardar: ' + (err.message || 'desconocido'), 'error'); }
    finally { A.dom.btnEditSave.textContent = '✓ GUARDAR'; A.dom.btnEditSave.disabled = false; }
  };

  window.approveRecuerdo = function(id) {
    A.s._approvalTargetId = id;
    var record = null;
    if (window._pendingRecords) {
      for (var i = 0; i < window._pendingRecords.length; i++) {
        if (String(window._pendingRecords[i].id) === String(id)) { record = window._pendingRecords[i]; break; }
      }
    }
    if (A.dom.approvalSeccion) {
      var seccionActual = (record && record.seccion) || 'Galeria';
      if (A.SECCIONES_VALIDAS.indexOf(seccionActual) !== -1) A.dom.approvalSeccion.value = seccionActual;
    }
    A.toggleApprovalRelatoFields();
    var txt = (record && (record.mensaje_largo || record.mensaje)) || '';
    if (A.dom.approvalTextoLargo) A.dom.approvalTextoLargo.value = txt;
    if (A.dom.approvalTextoLargoStd) A.dom.approvalTextoLargoStd.value = txt;
    if (A.dom.approvalTitulo) A.dom.approvalTitulo.value = (record && (record.titulo_relato || record.nombre || '')) || '';
    if (A.dom.approvalSerie) A.dom.approvalSerie.value = (record && record.nombre_serie) || '';
    if (A.dom.approvalTranscripcion) A.dom.approvalTranscripcion.value = (record && record.transcripcion) || '';
    if (A.dom.approvalDestacado) A.dom.approvalDestacado.checked = (record && record.destacado === true);
    if (A.dom.approvalModal) A.dom.approvalModal.style.display = 'flex';
  };

  A.confirmApproval = async function() {
    var id = A.s._approvalTargetId;
    if (!id) { A.closeApprovalModal(); return; }
    var seccion = A.dom.approvalSeccion ? A.dom.approvalSeccion.value : 'Galeria';
    if (!A.validarSeccion(seccion)) return;
    var textoLargo = '', tituloRelato = '', nombreSerie = '';
    if (seccion === 'Relatos: El Jano' || seccion === 'Relatos: El Arca' || seccion === 'Relatos: Otras organizaciones' || seccion === 'Relatos: Anecdotas') {
      textoLargo = A.dom.approvalTextoLargo ? A.dom.approvalTextoLargo.value.trim() : '';
      tituloRelato = A.dom.approvalTitulo ? A.dom.approvalTitulo.value.trim() : '';
      nombreSerie = A.dom.approvalSerie ? A.dom.approvalSerie.value.trim() : '';
    } else {
      textoLargo = A.dom.approvalTextoLargoStd ? A.dom.approvalTextoLargoStd.value.trim() : '';
      tituloRelato = A.dom.approvalTitulo ? A.dom.approvalTitulo.value.trim() : '';
    }
    var transcripcion = A.dom.approvalTranscripcion ? A.dom.approvalTranscripcion.value.trim() : '';
    var destacado = A.dom.approvalDestacado ? A.dom.approvalDestacado.checked : false;

    A.dom.btnApprovalConfirm.textContent = 'Publicando...';
    A.dom.btnApprovalConfirm.disabled = true;
    try {
      var s = window.__admin.getSupabaseClient();
      if (!s) throw new Error('Cliente Supabase no disponible');
      var updateData = { aprobado: true, seccion: seccion, titulo_relato: tituloRelato || null, nombre_serie: nombreSerie || null, mensaje_largo: textoLargo || null, destacado: destacado, es_efimero: destacado, transcripcion: transcripcion || null };
      var { error: updateError } = await s.from('recuerdos').update(updateData).eq('id', id);
      if (updateError) throw updateError;
      A.showToast('Recuerdo aprobado y publicado en ' + (A.NOMBRES_SECCION[seccion] || seccion), 'success');
      A.registrarAuditoria('approve', 'recuerdo', id, { seccion: seccion, titulo: tituloRelato });
      A.closeApprovalModal();
      A.loadPending();
      A.loadDashboard();
      A.loadApproved();
    } catch (err) { A.showToast('Error al aprobar: ' + (err.message || 'desconocido'), 'error'); }
    finally { A.dom.btnApprovalConfirm.textContent = '✓ CONFIRMAR PUBLICACIÓN'; A.dom.btnApprovalConfirm.disabled = false; }
  };

  window.rejectRecuerdo = function(id) {
    A.s._rejectionTargetId = id;
    if (A.dom.rejectionModal) A.dom.rejectionModal.style.display = 'flex';
  };

  window.rejectRecuerdoDirecto = window.rejectRecuerdo;

  A.confirmRejection = async function() {
    var id = A.s._rejectionTargetId;
    if (!id) { A.closeRejectionModal(); return; }
    var razon = A.dom.rejectionRazon ? A.dom.rejectionRazon.value : 'Otro';
    var detalle = A.dom.rejectionDetalle ? A.dom.rejectionDetalle.value.trim() : '';

    A.dom.btnRejectionConfirm.textContent = 'Eliminando...';
    A.dom.btnRejectionConfirm.disabled = true;
    try {
      var s = await A.waitForSupabase();
      if (!s) throw new Error('Cliente Supabase no disponible');
      var { data: recordToDelete, error: fetchError } = await s.from('recuerdos').select('*').eq('id', id).single();
      if (fetchError) throw fetchError;
      var { error: auditError } = await s.from('audit_log').insert({
        accion: 'reject', entidad: 'recuerdo', entidad_id: Number(id),
        usuario_id: (A.s.userData && A.s.userData.id) || null,
        usuario_email: (A.s.userData && A.s.userData.email) || null,
        metadata: { razon: razon, detalle: detalle || null, record_snapshot: recordToDelete }
      });
      if (auditError) console.warn('[Rechazo] Error al guardar snapshot:', auditError.message);
      var { error: logError } = await s.from('rechazos').insert({ recuerdo_id: Number(id), razon: razon, detalle: detalle || null, revisado_por: (A.s.userData && A.s.userData.email) || 'admin' });
      if (logError) console.warn('[Rechazo] No se pudo registrar en rechazos:', logError.message);
      var { error: deleteError } = await s.from('recuerdos').delete().eq('id', id);
      if (deleteError) throw deleteError;
      A.showToast('Recuerdo eliminado (motivo: ' + razon + ')', 'info');
      A.closeRejectionModal();
      A.loadPending();
      A.loadApproved();
      A.loadHistory();
      A.loadDashboard();
    } catch (err) {
      if (err.message !== 'Sesión expirada') A.showToast('Error al eliminar', 'error');
    } finally {
      A.dom.btnRejectionConfirm.textContent = '✕ ELIMINAR';
      A.dom.btnRejectionConfirm.disabled = false;
    }
  };
})();
