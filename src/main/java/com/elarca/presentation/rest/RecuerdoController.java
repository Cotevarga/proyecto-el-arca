package com.elarca.presentation.rest;

import com.elarca.application.dto.ApiResponse;
import com.elarca.application.dto.RecuerdoDTO;
import com.elarca.application.usecase.RecuerdoUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/recuerdos")
@Tag(name = "Admin - Recuerdos", description = "Gestión de recuerdos del archivo comunitario")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class RecuerdoController {

    private final RecuerdoUseCase recuerdoUseCase;

    public RecuerdoController(RecuerdoUseCase recuerdoUseCase) {
        this.recuerdoUseCase = recuerdoUseCase;
    }

    @GetMapping
    @Operation(summary = "Listar todos los recuerdos", description = "Obtiene todos los recuerdos (aprobados y pendientes)")
    public ResponseEntity<ApiResponse<List<RecuerdoDTO>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(recuerdoUseCase.getAll()));
    }

    @PutMapping("/{id}/aprobar")
    @Operation(summary = "Aprobar un recuerdo", description = "Aprueba un recuerdo y opcionalmente lo asigna a una sección")
    public ResponseEntity<ApiResponse<RecuerdoDTO>> approve(
            @PathVariable Long id,
            @RequestParam(required = false) String seccion) {
        return ResponseEntity.ok(ApiResponse.ok(recuerdoUseCase.approve(id, seccion)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un recuerdo", description = "Elimina un recuerdo y su archivo asociado")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        recuerdoUseCase.delete(id);
        return ResponseEntity.ok(ApiResponse.empty());
    }
}
