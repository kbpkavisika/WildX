package com.wildx.wildx.service;

import com.wildx.wildx.dto.CameraBurstResponse;
import com.wildx.wildx.dto.CameraImageFile;
import com.wildx.wildx.dto.CameraImageResponse;
import com.wildx.wildx.dto.CameraImageTagRequest;
import com.wildx.wildx.dto.CameraImageUploadResponse;
import com.wildx.wildx.type.CameraImageStatus;
import java.time.Instant;
import java.util.List;

public interface CameraImageService {
    CameraImageUploadResponse ingest(String cameraCode, Instant capturedAt, byte[] content);
    List<CameraBurstResponse> bursts(Long parkId, CameraImageStatus status);
    CameraImageResponse tag(Long parkId, Long imageId, Long userId, CameraImageTagRequest request);
    CameraImageFile file(Long parkId, Long imageId, Long userId, String reason);
}
