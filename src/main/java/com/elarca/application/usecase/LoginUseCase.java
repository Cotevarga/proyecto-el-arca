package com.elarca.application.usecase;

import com.elarca.application.dto.LoginRequest;
import com.elarca.application.dto.LoginResponse;

public interface LoginUseCase {
    LoginResponse execute(LoginRequest request);
}
