package com.elarca.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "recuerdos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecuerdoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    private String nombre;

    @Column(length = 255)
    private String anio;

    @Column(columnDefinition = "TEXT")
    private String mensaje;

    @Column(name = "tipo_archivo", length = 100)
    private String tipoArchivo;

    @Column(name = "url_archivo", length = 1024)
    private String urlArchivo;

    @Column(name = "storage_path", length = 512)
    private String storagePath;

    @Column(name = "nombre_original", length = 255)
    private String nombreOriginal;

    @Column(name = "tamanio_bytes")
    private Long tamanioBytes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean aprobado = false;

    @Column(length = 100)
    private String seccion;

    @Column(columnDefinition = "TEXT")
    private String texto;

    @Column(length = 50)
    private String tipo;

    @Column(length = 1024)
    private String url;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
