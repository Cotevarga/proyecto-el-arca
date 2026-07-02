package com.elarca.presentation.rest;

import com.elarca.application.dto.ApiResponse;
import com.elarca.application.dto.LoginRequest;
import com.elarca.application.dto.LoginResponse;
import com.elarca.application.usecase.LoginUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticación", description = "Login y emisión de tokens JWT")
@SecurityRequirements
public class AuthController {

    private final LoginUseCase loginUseCase;

    public AuthController(LoginUseCase loginUseCase) {
        this.loginUseCase = loginUseCase;
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión",
               description = "Autentica al administrador con email y contraseña. Devuelve un token JWT para los endpoints protegidos.")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = loginUseCase.execute(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
