package com.wildx.wildx.service;

import com.wildx.wildx.dto.LoginRequest;
import com.wildx.wildx.dto.LoginResponse;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.type.Role;
import org.springframework.security.oauth2.jwt.Jwt;
import java.util.List;

public interface AuthService {

    LoginResponse login(LoginRequest request);
    UserResponse current(Jwt jwt);
    void requireParkAccess(Jwt jwt, Long parkId);
    AppUser requireRanger(Long userId, Long parkId);
    List<Long> activeUserIds(Long parkId, Role role);
}
