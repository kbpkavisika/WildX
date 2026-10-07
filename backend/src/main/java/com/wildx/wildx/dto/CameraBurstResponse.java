package com.wildx.wildx.dto;

import java.time.Instant;
import java.util.List;

public record CameraBurstResponse(String cameraCode, Instant startedAt, Instant endedAt,
                                  List<CameraImageResponse> images) {}
