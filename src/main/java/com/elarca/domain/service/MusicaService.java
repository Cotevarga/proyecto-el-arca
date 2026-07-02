package com.elarca.domain.service;

import com.elarca.domain.model.Musica;
import java.util.List;

public interface MusicaService {
    List<Musica> findAll();
    List<Musica> findActive();
    Musica create(String titulo, String artista, String contentType, byte[] data, String originalFilename);
    Musica toggleActive(Long id, Boolean activo);
    void delete(Long id);
    List<Musica> getFallbackList();
}
