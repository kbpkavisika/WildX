package com.wildx.wildx.dto;

import java.time.Instant;

public record CameraImageUploadResponse(Long imageId, String cameraCode, Instant capturedAt, boolean stored) {}
