package com.elarca.application.usecase;

import com.elarca.application.dto.MusicaDTO;
import java.util.List;

public interface MusicaUseCase {
    List<MusicaDTO> getAll();
    List<MusicaDTO> getActive();
    MusicaDTO create(String titulo, String artista, String contentType, byte[] data, String originalFilename);
    MusicaDTO toggleActive(Long id, Boolean activo);
    void delete(Long id);
}
