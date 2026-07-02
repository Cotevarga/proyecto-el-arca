package com.elarca.infrastructure.persistence.mapper;

import com.elarca.domain.model.User;
import com.elarca.infrastructure.persistence.entity.UserEntity;
import org.springframework.stereotype.Component;

@Component
public class UserEntityMapper {

    public User toDomain(UserEntity entity) {
        if (entity == null) return null;
        return new User(entity.getId(), entity.getEmail(), entity.getNombre());
    }
}
