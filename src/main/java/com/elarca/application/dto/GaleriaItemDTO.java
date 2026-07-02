package com.elarca.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Elemento de la galería de imágenes")
public record GaleriaItemDTO(
    Object id,
    String url,
    String titulo,
    String descripcion
) {}
