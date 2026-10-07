package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import java.util.List;

public interface PatrolTrackService {
    List<TrackPointResponse> record(UserResponse caller, Long patrolId, List<PatrolPointRequest> requests);
}

