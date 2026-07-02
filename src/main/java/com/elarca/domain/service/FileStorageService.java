package com.elarca.domain.service;

public interface FileStorageService {
    String store(byte[] data, String originalFilename, String subfolder);
    void delete(String storagePath);
    String getPublicUrl(String storagePath);
    boolean isValidImageMimeType(String mimeType);
    boolean isValidAudioMimeType(String mimeType);
}
