package com.wildx.wildx.service;

import com.wildx.wildx.dto.CameraImageUploadResponse;
import java.time.Instant;

public interface CameraImageService {
    CameraImageUploadResponse ingest(String cameraCode, Instant capturedAt, byte[] content);
}
