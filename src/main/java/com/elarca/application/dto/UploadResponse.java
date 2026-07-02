package com.elarca.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta a una subida de archivo")
public record UploadResponse(
    @Schema(description = "Indica si la operación fue exitosa")
    boolean success,

    @Schema(description = "Mensaje informativo")
    String message,

    RecuerdoDTO recuerdo
) {}
