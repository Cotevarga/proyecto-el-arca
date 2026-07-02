package com.elarca.application.usecase;

import com.elarca.application.dto.MusicaDTO;
import com.elarca.application.mapper.MusicaMapper;
import com.elarca.domain.service.MusicaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MusicaUseCaseImpl implements MusicaUseCase {

    private final MusicaService musicaService;
    private final MusicaMapper musicaMapper;

    @Override
    @Transactional(readOnly = true)
    public List<MusicaDTO> getAll() {
        return musicaService.findAll().stream()
            .map(musicaMapper::toDto)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MusicaDTO> getActive() {
        return musicaService.findActive().stream()
            .map(musicaMapper::toDto)
            .toList();
    }

    @Override
    @Transactional
    public MusicaDTO create(String titulo, String artista,
                             String contentType, byte[] data,
                             String originalFilename) {
        return musicaMapper.toDto(
            musicaService.create(titulo, artista, contentType, data, originalFilename));
    }

    @Override
    @Transactional
    public MusicaDTO toggleActive(Long id, Boolean activo) {
        return musicaMapper.toDto(musicaService.toggleActive(id, activo));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        musicaService.delete(id);
    }
}
