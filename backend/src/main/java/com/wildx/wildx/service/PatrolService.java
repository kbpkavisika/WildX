package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.type.PatrolStatus;
import java.time.LocalDate;
import java.util.List;
import com.wildx.wildx.model.Patrol;

public interface PatrolService {
    PatrolResponse assign(Long parkId, PatrolAssignRequest request);
    List<PatrolResponse> today(UserResponse caller);
    List<PatrolResponse> list(Long parkId, PatrolStatus status, LocalDate date);
    PatrolResponse start(UserResponse caller, Long id, PatrolTimeRequest request);
    Patrol lockOwned(UserResponse caller, Long id);
    PatrolResponse gps(UserResponse caller, Long id, PatrolGpsRequest request);
    PatrolResponse end(UserResponse caller, Long id, PatrolTimeRequest request);
}
