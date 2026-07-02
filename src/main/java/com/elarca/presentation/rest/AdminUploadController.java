package com.elarca.presentation.rest;

import com.elarca.application.dto.ApiResponse;
import com.elarca.application.dto.RecuerdoDTO;
import com.elarca.application.usecase.RecuerdoUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/subir")
@Tag(name = "Admin - Subida Directa", description = "Subida de contenido por el administrador (aprobación automática)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUploadController {

    private final RecuerdoUseCase recuerdoUseCase;

    public AdminUploadController(RecuerdoUseCase recuerdoUseCase) {
        this.recuerdoUseCase = recuerdoUseCase;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Subir archivo como admin",
               description = "Sube un archivo que queda automáticamente aprobado. Requiere token JWT.")
    public ResponseEntity<ApiResponse<RecuerdoDTO>> uploadAsAdmin(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(required = false) String texto,
            @RequestParam(defaultValue = "general") String seccion) throws IOException {

        RecuerdoDTO dto = recuerdoUseCase.uploadAsAdmin(
            texto, seccion, archivo.getContentType(),
            archivo.getBytes(), archivo.getOriginalFilename(), archivo.getSize());

        log.info("Admin subió archivo: {}", archivo.getOriginalFilename());
        return ResponseEntity.ok(ApiResponse.created(dto));
    }
}
