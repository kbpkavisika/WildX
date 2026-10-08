package com.wildx.wildx.service;

import com.wildx.wildx.dto.IncidentCreateRequest;
import com.wildx.wildx.dto.IncidentResponse;
import com.wildx.wildx.dto.UserResponse;

public interface IncidentService {
    IncidentResponse report(UserResponse caller, IncidentCreateRequest request, byte[] photo);
}
