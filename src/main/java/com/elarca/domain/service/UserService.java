package com.elarca.domain.service;

import com.elarca.domain.model.User;

public interface UserService {
    User authenticate(String email, String rawPassword);
    User findByEmail(String email);
}
