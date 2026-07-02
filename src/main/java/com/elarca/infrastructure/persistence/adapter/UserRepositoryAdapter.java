package com.elarca.infrastructure.persistence.adapter;

import com.elarca.domain.model.User;
import com.elarca.domain.repository.UserRepository;
import com.elarca.infrastructure.persistence.mapper.UserEntityMapper;
import com.elarca.infrastructure.persistence.repository.JpaUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepository {

    private final JpaUserRepository jpaUserRepository;
    private final UserEntityMapper mapper;

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaUserRepository.findByEmail(email).map(mapper::toDomain);
    }
}
