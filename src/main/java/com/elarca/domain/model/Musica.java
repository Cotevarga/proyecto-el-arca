package com.elarca.domain.model;

import java.time.Instant;

public record Musica(
    Long id,
    String titulo,
    String artista,
    String urlMp3,
    String storagePath,
    Boolean activo,
    Integer orden,
    Instant createdAt
) {}
