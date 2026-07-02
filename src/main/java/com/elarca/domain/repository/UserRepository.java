package com.elarca.domain.repository;

import com.elarca.domain.model.User;
import java.util.Optional;

public interface UserRepository {
    Optional<User> findByEmail(String email);
}
