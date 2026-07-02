package com.elarca.infrastructure.storage;

import com.elarca.domain.service.FileStorageService;
import com.elarca.infrastructure.exception.FileStorageException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class LocalFileStorageAdapter implements FileStorageService {

    @Value("${elarca.storage.upload-dir}")
    private String uploadDir;

    @Value("${elarca.storage.allowed-image-types}")
    private String allowedImageTypes;

    @Value("${elarca.storage.allowed-audio-types}")
    private String allowedAudioTypes;

    private Path uploadPath;
    private final Set<String> validImageMimeTypes = new HashSet<>();
    private final Set<String> validAudioMimeTypes = new HashSet<>();

    @PostConstruct
    public void init() {
        uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            for (String sub : new String[]{"galeria", "recuerdos", "musica"}) {
                Files.createDirectories(uploadPath.resolve(sub));
            }
        } catch (IOException e) {
            throw new FileStorageException("No se pudo crear directorio de uploads: " + uploadPath, e);
        }
        validImageMimeTypes.addAll(Arrays.asList(allowedImageTypes.split(",")));
        validAudioMimeTypes.addAll(Arrays.asList(allowedAudioTypes.split(",")));
        log.info("Directorio de uploads: {}", uploadPath);
    }

    @Override
    public String store(byte[] data, String originalFilename, String subfolder) {
        String ext = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) ext = originalFilename.substring(dotIndex).toLowerCase();

        String uniqueFilename = UUID.randomUUID() + ext;
        Path targetPath = uploadPath.resolve(subfolder).resolve(uniqueFilename);

        try {
            Files.write(targetPath, data);
            log.info("Archivo almacenado: {}", targetPath);
            return targetPath.toString();
        } catch (IOException e) {
            throw new FileStorageException("Error al almacenar: " + originalFilename, e);
        }
    }

    @Override
    public void delete(String storagePath) {
        try {
            Path filePath = Paths.get(storagePath);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Archivo eliminado: {}", storagePath);
            }
        } catch (IOException e) {
            log.error("Error al eliminar archivo: {}", storagePath, e);
        }
    }

    @Override
    public String getPublicUrl(String storagePath) {
        Path path = Paths.get(storagePath);
        String relative = uploadPath.relativize(path).toString().replace("\\", "/");
        return "/uploads/" + relative;
    }

    @Override
    public boolean isValidImageMimeType(String mimeType) {
        return mimeType != null && validImageMimeTypes.contains(mimeType.toLowerCase());
    }

    @Override
    public boolean isValidAudioMimeType(String mimeType) {
        return mimeType != null && validAudioMimeTypes.contains(mimeType.toLowerCase());
    }
}
