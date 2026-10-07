package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.model.PatrolRoute;
import java.util.List;

public interface PatrolRouteService {
    PatrolRouteResponse create(Long parkId, PatrolRouteRequest request);
    List<PatrolRouteResponse> list(Long parkId);
    PatrolRoute require(Long id, Long parkId);
}

