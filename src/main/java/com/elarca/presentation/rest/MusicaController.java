package com.elarca.presentation.rest;

import com.elarca.application.dto.ApiResponse;
import com.elarca.application.dto.MusicaDTO;
import com.elarca.application.usecase.MusicaUseCase;
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
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/musica")
@Tag(name = "Admin - Música", description = "Gestión de canciones del reproductor")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class MusicaController {

    private final MusicaUseCase musicaUseCase;

    public MusicaController(MusicaUseCase musicaUseCase) {
        this.musicaUseCase = musicaUseCase;
    }

    @GetMapping
    @Operation(summary = "Listar todas las canciones")
    public ResponseEntity<ApiResponse<List<MusicaDTO>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(musicaUseCase.getAll()));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Subir una nueva canción")
    public ResponseEntity<ApiResponse<MusicaDTO>> create(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) String artista) throws IOException {

        MusicaDTO dto = musicaUseCase.create(
            titulo, artista, archivo.getContentType(),
            archivo.getBytes(), archivo.getOriginalFilename());
        return ResponseEntity.ok(ApiResponse.created(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Activar/desactivar una canción")
    public ResponseEntity<ApiResponse<MusicaDTO>> toggleActive(
            @PathVariable Long id,
            @RequestBody(required = false) Boolean activo) {
        return ResponseEntity.ok(ApiResponse.ok(musicaUseCase.toggleActive(id, activo)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar una canción")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        musicaUseCase.delete(id);
        return ResponseEntity.ok(ApiResponse.empty());
    }
}
