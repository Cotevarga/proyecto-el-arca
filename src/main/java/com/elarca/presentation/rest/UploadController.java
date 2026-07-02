package com.elarca.presentation.rest;

import com.elarca.application.dto.ApiResponse;
import com.elarca.application.dto.RecuerdoDTO;
import com.elarca.application.dto.UploadResponse;
import com.elarca.application.usecase.RecuerdoUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
@Tag(name = "Subida Pública", description = "Endpoints para que la comunidad suba recuerdos")
@SecurityRequirements
public class UploadController {

    private final RecuerdoUseCase recuerdoUseCase;

    @PostMapping("/upload")
    @Operation(summary = "Subir recuerdo (público)",
               description = "Permite a cualquier persona subir un recuerdo. Queda pendiente de aprobación.")
    public ResponseEntity<ApiResponse<UploadResponse>> upload(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String anio,
            @RequestParam(required = false) String mensaje) throws IOException {

        recuerdoUseCase.upload(nombre, anio, mensaje, archivo.getContentType(),
            archivo.getBytes(), archivo.getOriginalFilename(), archivo.getSize());

        log.info("Recuerdo subido por: {}", nombre != null ? nombre : "Anónimo");
        return ResponseEntity.ok(ApiResponse.ok(
            new UploadResponse(true, "Recuerdo recibido con éxito.", null)));
    }

    @PostMapping("/subir")
    @Operation(summary = "Subir recuerdo (alias)",
               description = "Alias de /upload para compatibilidad con versiones anteriores")
    public ResponseEntity<ApiResponse<UploadResponse>> subir(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String anio,
            @RequestParam(required = false) String mensaje) throws IOException {
        return upload(archivo, nombre, anio, mensaje);
    }
}
