package com.elarca.application.mapper;

import com.elarca.application.dto.RecuerdoDTO;
import com.elarca.domain.model.Recuerdo;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RecuerdoMapper {
    RecuerdoDTO toDto(Recuerdo domain);
}
