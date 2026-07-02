package com.elarca.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Respuesta estándar de la API")
public record ApiResponse<T>(
    @Schema(description = "Código HTTP")
    int status,

    @Schema(description = "Indica si la operación fue exitosa")
    boolean success,

    @Schema(description = "Mensaje descriptivo")
    String message,

    @Schema(description = "Datos de la respuesta")
    T data,

    @Schema(description = "Timestamp de la respuesta")
    Instant timestamp,

    @Schema(description = "Errores de validación por campo")
    List<FieldError> errors
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(200, true, "OK", data, Instant.now(), null);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(201, true, "Creado", data, Instant.now(), null);
    }

    public static <T> ApiResponse<T> empty() {
        return new ApiResponse<>(204, true, "Sin contenido", null, Instant.now(), null);
    }

    public record FieldError(String field, String message) {}
}
