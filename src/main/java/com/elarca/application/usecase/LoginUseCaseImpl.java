package com.elarca.application.usecase;

import com.elarca.application.dto.LoginRequest;
import com.elarca.application.dto.LoginResponse;
import com.elarca.domain.model.User;
import com.elarca.domain.service.UserService;
import com.elarca.infrastructure.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginUseCaseImpl implements LoginUseCase {

    private final UserService userService;
    private final JwtProvider jwtProvider;

    @Override
    public LoginResponse execute(LoginRequest request) {
        User user = userService.authenticate(request.email(), request.password());
        String token = jwtProvider.generateToken(user.id(), user.email(), user.nombre());

        log.info("Login exitoso: {}", user.email());
        return new LoginResponse(true, token,
            new LoginResponse.UserInfo(user.id(), user.email(), user.nombre()));
    }
}
