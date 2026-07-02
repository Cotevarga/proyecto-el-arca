package com.elarca.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta de autenticación")
public record LoginResponse(
    @Schema(description = "Indica si la autenticación fue exitosa")
    boolean success,

    @Schema(description = "Token JWT de acceso")
    String token,

    @Schema(description = "Información del usuario autenticado")
    UserInfo user
) {
    public record UserInfo(
        @Schema(example = "1") Long id,
        @Schema(example = "admin@elarca.cl") String email,
        @Schema(example = "Admin") String nombre
    ) {}
}
