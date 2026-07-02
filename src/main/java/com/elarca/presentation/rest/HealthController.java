package com.elarca.presentation.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@Tag(name = "Salud", description = "Endpoint de health check para Render y monitoreo")
@SecurityRequirements
public class HealthController {

    @GetMapping("/api/v1/health")
    @Operation(summary = "Health check", description = "Devuelve el estado de la aplicación. Usado por Render para monitoreo.")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "timestamp", Instant.now().toString(),
            "service", "elarca-backend",
            "version", "2.0.0"
        ));
    }
}
