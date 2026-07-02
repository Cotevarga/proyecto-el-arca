package com.elarca.domain.model;

import java.time.Instant;

public record Recuerdo(
    Long id,
    String nombre,
    String anio,
    String mensaje,
    String tipoArchivo,
    String urlArchivo,
    String storagePath,
    String nombreOriginal,
    Long tamanioBytes,
    Boolean aprobado,
    String seccion,
    String texto,
    String tipo,
    String url,
    Instant createdAt
) {}
