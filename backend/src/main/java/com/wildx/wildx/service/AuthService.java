package com.wildx.wildx.service;

import com.wildx.wildx.dto.LoginRequest;
import com.wildx.wildx.dto.LoginResponse;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.model.AppUser;
import org.springframework.security.oauth2.jwt.Jwt;

public interface AuthService {

    LoginResponse login(LoginRequest request);
    UserResponse current(Jwt jwt);
    void requireParkAccess(Jwt jwt, Long parkId);
    AppUser requireRanger(Long userId, Long parkId);
}
