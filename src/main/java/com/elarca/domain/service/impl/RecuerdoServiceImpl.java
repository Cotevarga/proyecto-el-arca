package com.elarca.domain.service.impl;

import com.elarca.domain.model.Recuerdo;
import com.elarca.domain.repository.RecuerdoRepository;
import com.elarca.domain.service.FileStorageService;
import com.elarca.domain.service.RecuerdoService;
import com.elarca.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecuerdoServiceImpl implements RecuerdoService {

    private final RecuerdoRepository recuerdoRepository;
    private final FileStorageService fileStorageService;

    @Override
    public List<Recuerdo> findAll() {
        return recuerdoRepository.findAllOrderByCreatedAtDesc();
    }

    @Override
    public List<Recuerdo> findApproved() {
        return recuerdoRepository.findApprovedOrderByCreatedAtDesc();
    }

    @Override
    public Recuerdo approve(Long id, String seccion) {
        Recuerdo recuerdo = recuerdoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Recuerdo no encontrado: " + id));

        Recuerdo updated = new Recuerdo(
            recuerdo.id(), recuerdo.nombre(), recuerdo.anio(),
            recuerdo.mensaje(), recuerdo.tipoArchivo(), recuerdo.urlArchivo(),
            recuerdo.storagePath(), recuerdo.nombreOriginal(), recuerdo.tamanioBytes(),
            true,
            seccion != null ? seccion : recuerdo.seccion(),
            recuerdo.texto(), recuerdo.tipo(), recuerdo.url(),
            recuerdo.createdAt()
        );

        Recuerdo saved = recuerdoRepository.save(updated);
        log.info("Recuerdo aprobado: id={}", id);
        return saved;
    }

    @Override
    public void delete(Long id) {
        Recuerdo recuerdo = recuerdoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Recuerdo no encontrado: " + id));

        if (recuerdo.storagePath() != null && !recuerdo.storagePath().isBlank()) {
            fileStorageService.delete(recuerdo.storagePath());
        }

        recuerdoRepository.deleteById(id);
        log.info("Recuerdo eliminado: id={}", id);
    }

    @Override
    public Recuerdo upload(String nombre, String anio, String mensaje,
                           String contentType, byte[] data,
                           String originalFilename, long size) {
        String subfolder = contentType != null && contentType.startsWith("image/")
            ? "galeria" : "recuerdos";

        String storedPath = fileStorageService.store(data, originalFilename, subfolder);
        String publicUrl = fileStorageService.getPublicUrl(storedPath);

        Recuerdo recuerdo = new Recuerdo(
            null, nombre != null ? nombre : "Anónimo",
            anio != null ? anio : "",
            mensaje != null ? mensaje : "",
            contentType, publicUrl, storedPath,
            originalFilename, size,
            false, null, null, null, null,
            Instant.now()
        );

        Recuerdo saved = recuerdoRepository.save(recuerdo);
        log.info("Recuerdo subido: nombre={}", nombre);
        return saved;
    }

    @Override
    public Recuerdo uploadAsAdmin(String texto, String seccion,
                                   String contentType, byte[] data,
                                   String originalFilename, long size) {
        String subfolder = contentType != null && contentType.startsWith("image/")
            ? "galeria" : "recuerdos";

        String storedPath = fileStorageService.store(data, originalFilename, subfolder);
        String publicUrl = fileStorageService.getPublicUrl(storedPath);

        Recuerdo recuerdo = new Recuerdo(
            null, "Admin", null, texto,
            contentType, publicUrl, storedPath,
            originalFilename, size,
            true,
            seccion != null ? seccion : "general",
            texto,
            contentType != null && contentType.startsWith("video/") ? "video" : "imagen",
            publicUrl,
            Instant.now()
        );

        Recuerdo saved = recuerdoRepository.save(recuerdo);
        log.info("Admin subió archivo: id={}", saved.id());
        return saved;
    }
}
