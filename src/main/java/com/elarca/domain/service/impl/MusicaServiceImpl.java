package com.elarca.domain.service.impl;

import com.elarca.domain.model.Musica;
import com.elarca.domain.repository.MusicaRepository;
import com.elarca.domain.service.FileStorageService;
import com.elarca.domain.service.MusicaService;
import com.elarca.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MusicaServiceImpl implements MusicaService {

    private final MusicaRepository musicaRepository;
    private final FileStorageService fileStorageService;

    @Override
    public List<Musica> findAll() {
        return musicaRepository.findAllOrderByOrdenAsc();
    }

    @Override
    public List<Musica> findActive() {
        List<Musica> active = musicaRepository.findActiveOrderByOrdenAsc();
        if (active.isEmpty()) {
            return getFallbackList();
        }
        return active;
    }

    @Override
    public Musica create(String titulo, String artista,
                         String contentType, byte[] data,
                         String originalFilename) {
        String storedPath = fileStorageService.store(data, originalFilename, "musica");
        String publicUrl = fileStorageService.getPublicUrl(storedPath);

        int nextOrden = musicaRepository.findAllOrderByOrdenAsc().size() + 1;

        Musica musica = new Musica(
            null,
            titulo != null ? titulo : originalFilename.replaceFirst("\\.[^.]+$", ""),
            artista != null ? artista : "El Arca",
            publicUrl, true, nextOrden, Instant.now()
        );

        Musica saved = musicaRepository.save(musica);
        log.info("Canción subida: titulo={}", saved.titulo());
        return saved;
    }

    @Override
    public Musica toggleActive(Long id, Boolean activo) {
        Musica musica = musicaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Canción no encontrada: " + id));

        Musica updated = new Musica(
            musica.id(), musica.titulo(), musica.artista(),
            musica.urlMp3(),
            activo != null ? activo : !musica.activo(),
            musica.orden(), musica.createdAt()
        );

        Musica saved = musicaRepository.save(updated);
        log.info("Canción {}: activo={}", id, saved.activo());
        return saved;
    }

    @Override
    public void delete(Long id) {
        Musica musica = musicaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Canción no encontrada: " + id));

        if (musica.storagePath() != null) {
            fileStorageService.delete(musica.storagePath());
        }

        musicaRepository.deleteById(id);
        log.info("Canción eliminada: id={}", id);
    }

    @Override
    public List<Musica> getFallbackList() {
        return List.of(new Musica(
            0L, "Radio Libre", "El Arca",
            "/musica/index.mp3", true, 1, null
        ));
    }
}
