package com.elarca.application.mapper;

import com.elarca.application.dto.MusicaDTO;
import com.elarca.domain.model.Musica;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MusicaMapper {
    MusicaDTO toDto(Musica domain);
}
