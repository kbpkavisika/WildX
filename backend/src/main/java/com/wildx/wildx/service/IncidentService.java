package com.wildx.wildx.service;

import com.wildx.wildx.dto.IncidentCreateRequest;
import com.wildx.wildx.dto.IncidentPhoto;
import com.wildx.wildx.dto.IncidentResponse;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.model.Incident;
import com.wildx.wildx.type.IncidentStatus;
import com.wildx.wildx.type.Severity;
import java.util.List;

public interface IncidentService {
    IncidentResponse report(UserResponse caller, IncidentCreateRequest request, byte[] photo);
    List<IncidentResponse> list(Long parkId, IncidentStatus status, Long typeId, Severity severity);
    IncidentResponse get(UserResponse caller, Long id);
    IncidentPhoto photo(UserResponse caller, Long id);
    List<IncidentResponse> mine(Long reporterId);
    IncidentResponse changeSeverity(Long parkId, Long id, Severity severity);
    IncidentResponse dismiss(Long parkId, Long id, String reason);
    Incident assign(Long parkId, Long id);
    void resolve(Long id, String outcome);
    void reopen(Long id);
}
