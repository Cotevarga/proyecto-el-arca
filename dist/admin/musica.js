(function() {
  'use strict';
  var A = window.__admin;

  A.actualizarListadoMusica = async function() {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var { data, error } = await s.from('musica_reproductor').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      var canciones = data || [];
      var contenedor = A.dom.contenedorCanciones;
      if (!contenedor) return;
      contenedor.innerHTML = '';
      if (canciones.length === 0) {
        contenedor.innerHTML = '<div class="empty-state" style="padding:20px 0;"><div class="icon">🎶</div><div class="text">No hay canciones subidas</div></div>';
        A.s._cancionesRenderizadas = {};
        return;
      }
      var added = {};
      canciones.forEach(function(c) {
        var id = String(c.id);
        if (added[id]) return;
        added[id] = true;
        var card = document.createElement('div');
        card.className = 'song-item';
        card.dataset.id = id;
        var badgeHtml = c.activo ? '<span class="badge badge-approved" style="font-size:10px;margin-left:8px;">AL AIRE</span>' : '';
        card.innerHTML = '<div class="song-info"><div class="song-title">' + A.escapeHtml(c.titulo) + ' ' + badgeHtml + '</div><div class="song-artist">' + A.escapeHtml(c.artista || 'El Arca') + '</div></div>' +
          '<div class="song-actions"><button class="btn-sm btn-sm-approve" onclick="window.previsualizarMusica(\'' + A.escapeHtml(c.url_mp3) + '\')" title="Previsualizar" aria-label="Reproducir previsualización">▶ PLAY</button> ' +
          '<button class="btn-sm btn-sm-reject" onclick="window.eliminarCancion(\'' + id + '\')" aria-label="Eliminar canción">✕ ELIMINAR</button></div>';
        contenedor.appendChild(card);
      });
      A.s._cancionesRenderizadas = added;
    } catch (err) { if (err.message !== 'Sesión expirada') A.showToast('Error al cargar canciones', 'error'); }
  };

  window.previsualizarMusica = function(url) {
    if (!url) { A.showToast('URL de audio no disponible', 'error'); return; }
    var a = A.getMusicPreviewAudio();
    if (a.src === url && !a.paused) { a.pause(); A.showToast('Previsualización detenida', 'info'); return; }
    a.src = url;
    a.play().then(function() { A.showToast('Reproduciendo previsualización', 'success'); })
      .catch(function(err) { A.showToast('Error al reproducir audio', 'error'); });
  };

  window.eliminarCancion = async function(id) {
    if (!confirm('¿Eliminar esta canción permanentemente?')) return;
    try {
      var s = window.__admin.getSupabaseClient();
      if (!s) throw new Error('Cliente Supabase no disponible');
      var { data: cancion, error: fetchError } = await s.from('musica_reproductor').select('storage_path').eq('id', id).single();
      if (fetchError) throw fetchError;
      if (cancion && cancion.storage_path) {
        var { error: storageError } = await s.storage.from('elarca-uploads').remove([cancion.storage_path]);
        if (storageError) console.error('[EliminarCancion] Error al eliminar de Storage:', storageError);
      }
      var { error: deleteError } = await s.from('musica_reproductor').delete().eq('id', id);
      if (deleteError) throw deleteError;
      A.detenerPreview();
      A.showToast('Canción eliminada', 'info');
      A.registrarAuditoria('delete', 'musica', id, { storage_path: cancion?.storage_path });
      A.actualizarListadoMusica();
      A.refrescarContadores();
      A.cargarAhoraSuena();
    } catch (err) { if (err.message !== 'Sesión expirada') A.showToast('Error al eliminar', 'error'); }
  };

  window.deleteMusic = window.eliminarCancion;

  A.submitMusicUpload = async function(e) {
    e.preventDefault();
    var titulo = document.getElementById('music-titulo').value.trim();
    var artista = document.getElementById('music-artista').value.trim() || 'El Arca';
    var file = A.dom.musicFileInput && A.dom.musicFileInput.files ? A.dom.musicFileInput.files[0] : null;
    if (!file) { A.showToast('Selecciona un archivo MP3', 'error'); return; }
    if (!titulo) { A.showToast('Ingresa el título', 'error'); return; }

    A.procesarSubida(A.dom.btnUploadMusic, async function() {
      var s = window.__admin.getSupabaseClient();
      if (!s) throw new Error('Cliente Supabase no disponible');
      var fileName = 'musica/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      var { error: uploadError } = await s.storage.from('elarca-uploads').upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      var { data: { publicUrl } } = s.storage.from('elarca-uploads').getPublicUrl(fileName);
      var { error: insertError } = await s.from('musica_reproductor').insert({ titulo: titulo, artista: artista, url_mp3: publicUrl, storage_path: fileName, activo: true, orden: 0 });
      if (insertError) throw insertError;
      A.registrarAuditoria('admin_upload', 'musica', null, { titulo: titulo, artista: artista, archivo: fileName });
      document.getElementById('music-upload-form').reset();
      if (A.dom.musicFileInfo) A.dom.musicFileInfo.textContent = '';
      if (A.dom.musicUploadText) A.dom.musicUploadText.textContent = 'Haz clic para seleccionar archivo MP3';
      A.actualizarListadoMusica();
      A.loadDashboard();
    });
  };
})();
