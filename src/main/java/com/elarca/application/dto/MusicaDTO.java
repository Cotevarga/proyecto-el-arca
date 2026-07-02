package com.elarca.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(description = "Canción del reproductor")
public record MusicaDTO(
    Long id,
    @Schema(example = "Radio Libre") String titulo,
    @Schema(example = "El Arca") String artista,
    String urlMp3,
    Boolean activo,
    Integer orden,
    Instant createdAt
) {}
