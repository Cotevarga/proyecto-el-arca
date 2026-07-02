package com.elarca.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(description = "Recuerdo del archivo comunitario")
public record RecuerdoDTO(
    Long id,
    @Schema(example = "María José") String nombre,
    @Schema(example = "2025") String anio,
    String mensaje,
    @Schema(example = "image/jpeg") String tipoArchivo,
    String urlArchivo,
    Boolean aprobado,
    String seccion,
    String texto,
    String tipo,
    String url,
    String nombreOriginal,
    Long tamanioBytes,
    Instant createdAt
) {}
