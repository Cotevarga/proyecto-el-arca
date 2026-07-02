package com.elarca.infrastructure.persistence.mapper;

import com.elarca.domain.model.Musica;
import com.elarca.infrastructure.persistence.entity.MusicaEntity;
import org.springframework.stereotype.Component;

@Component
public class MusicaEntityMapper {

    public Musica toDomain(MusicaEntity entity) {
        if (entity == null) return null;
        return new Musica(
            entity.getId(), entity.getTitulo(), entity.getArtista(),
            entity.getUrlMp3(), entity.getActivo(), entity.getOrden(),
            entity.getCreatedAt()
        );
    }

    public MusicaEntity toEntity(Musica domain) {
        if (domain == null) return null;
        return MusicaEntity.builder()
            .id(domain.id())
            .titulo(domain.titulo())
            .artista(domain.artista())
            .urlMp3(domain.urlMp3())
            .storagePath(null)
            .activo(domain.activo())
            .orden(domain.orden())
            .createdAt(domain.createdAt())
            .build();
    }
}
