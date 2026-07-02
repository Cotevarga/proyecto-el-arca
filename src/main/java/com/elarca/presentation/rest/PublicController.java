package com.elarca.presentation.rest;

import com.elarca.application.dto.ApiResponse;
import com.elarca.application.dto.GaleriaItemDTO;
import com.elarca.application.dto.MusicaDTO;
import com.elarca.application.dto.RecuerdoDTO;
import com.elarca.application.usecase.MusicaUseCase;
import com.elarca.application.usecase.RecuerdoUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
@Tag(name = "Público", description = "Endpoints públicos para el frontend SPA")
@SecurityRequirements
public class PublicController {

    private final RecuerdoUseCase recuerdoUseCase;
    private final MusicaUseCase musicaUseCase;

    @GetMapping("/galeria")
    @Operation(summary = "Obtener galería de imágenes",
               description = "Retorna imágenes aprobadas de la comunidad más las imágenes locales")
    public ResponseEntity<ApiResponse<List<GaleriaItemDTO>>> getGaleria() {
        List<RecuerdoDTO> approved = recuerdoUseCase.getApproved();

        List<GaleriaItemDTO> localImages = buildLocalGallery();
        List<GaleriaItemDTO> dbImages = approved.stream()
            .filter(r -> r.tipoArchivo() != null && r.tipoArchivo().startsWith("image/"))
            .map(r -> new GaleriaItemDTO(
                r.id(), r.urlArchivo(),
                "Aporte de " + (r.nombre() != null ? r.nombre() : "Anónimo"),
                r.mensaje() != null ? r.mensaje() :
                    (r.nombre() != null ? r.nombre() : "Anónimo") +
                    (r.anio() != null ? " (" + r.anio() + ")" : "")))
            .toList();

        List<GaleriaItemDTO> all = new ArrayList<>();
        all.addAll(localImages);
        all.addAll(dbImages);
        return ResponseEntity.ok(ApiResponse.ok(all));
    }

    @GetMapping("/musica")
    @Operation(summary = "Obtener canciones activas",
               description = "Retorna las canciones activas del reproductor, o una lista por defecto si no hay")
    public ResponseEntity<ApiResponse<List<MusicaDTO>>> getMusica() {
        List<MusicaDTO> active = musicaUseCase.getActive();
        return ResponseEntity.ok(ApiResponse.ok(active));
    }

    private List<GaleriaItemDTO> buildLocalGallery() {
        return List.of(
            new GaleriaItemDTO("local-1", "/images/FB_IMG_1782701605358.jpg", "El Cabezón Jano", null),
            new GaleriaItemDTO("local-2", "/images/FB_IMG_1782701655071.jpg", "Sede El Arca", null),
            new GaleriaItemDTO("local-3", "/images/FB_IMG_1782701775498.jpg", "Jano pintando", null),
            new GaleriaItemDTO("local-4", "/images/FB_IMG_1782701859802.jpg", "Navidad Popular", null),
            new GaleriaItemDTO("local-5", "/images/FB_IMG_1782701766075.jpg", "Marcha", null),
            new GaleriaItemDTO("local-6", "/images/FB_IMG_1782701826979.jpg", "TV Comunitaria", null),
            new GaleriaItemDTO("local-7", "/images/jano_inicio.jpg", "El Jano", null),
            new GaleriaItemDTO("local-8", "/images/navidad_popular.jpg", "Infancias", null),
            new GaleriaItemDTO("local-9", "/images/companeros_melon.jpg", "Compañeros", null),
            new GaleriaItemDTO("local-10", "/images/radio_libre.jpg", "Radio Libre", null),
            new GaleriaItemDTO("local-11", "/images/antupeñi.jpeg", "Antupeñi", null)
        );
    }
}
