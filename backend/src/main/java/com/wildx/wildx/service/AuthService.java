package com.wildx.wildx.service;

import com.wildx.wildx.dto.LoginRequest;
import com.wildx.wildx.dto.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);
}
