package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import java.util.List;

public interface PatrolMonitorService {
    List<PatrolLiveResponse> live(Long parkId);
    List<TrackPointResponse> track(UserResponse caller, Long patrolId);
}
