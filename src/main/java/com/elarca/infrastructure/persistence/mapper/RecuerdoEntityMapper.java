package com.elarca.infrastructure.persistence.mapper;

import com.elarca.domain.model.Recuerdo;
import com.elarca.infrastructure.persistence.entity.RecuerdoEntity;
import org.springframework.stereotype.Component;

@Component
public class RecuerdoEntityMapper {

    public Recuerdo toDomain(RecuerdoEntity entity) {
        if (entity == null) return null;
        return new Recuerdo(
            entity.getId(), entity.getNombre(), entity.getAnio(),
            entity.getMensaje(), entity.getTipoArchivo(), entity.getUrlArchivo(),
            entity.getStoragePath(), entity.getNombreOriginal(), entity.getTamanioBytes(),
            entity.getAprobado(), entity.getSeccion(), entity.getTexto(),
            entity.getTipo(), entity.getUrl(), entity.getCreatedAt()
        );
    }

    public RecuerdoEntity toEntity(Recuerdo domain) {
        if (domain == null) return null;
        return RecuerdoEntity.builder()
            .id(domain.id())
            .nombre(domain.nombre())
            .anio(domain.anio())
            .mensaje(domain.mensaje())
            .tipoArchivo(domain.tipoArchivo())
            .urlArchivo(domain.urlArchivo())
            .storagePath(domain.storagePath())
            .nombreOriginal(domain.nombreOriginal())
            .tamanioBytes(domain.tamanioBytes())
            .aprobado(domain.aprobado())
            .seccion(domain.seccion())
            .texto(domain.texto())
            .tipo(domain.tipo())
            .url(domain.url())
            .createdAt(domain.createdAt())
            .build();
    }
}
