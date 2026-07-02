package com.elarca.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Solicitud de inicio de sesión")
public record LoginRequest(
    @NotBlank(message = "El email es requerido")
    @Email(message = "Formato de email inválido")
    @Schema(example = "admin@elarca.cl", description = "Email del administrador")
    String email,

    @NotBlank(message = "La contraseña es requerida")
    @Schema(example = "admin", description = "Contraseña (bypass temporal: 'admin')")
    String password
) {}
