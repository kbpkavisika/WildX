package com.wildx.wildx.controller;

import com.wildx.wildx.config.ApiKeyGuard;
import com.wildx.wildx.dto.CameraImageUploadResponse;
import com.wildx.wildx.service.CameraImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.Instant;

@RestController
@RequestMapping("/api/v1/ingest")
@RequiredArgsConstructor
public class CameraIngestController {
    private final CameraImageService images;
    private final ApiKeyGuard apiKey;

    @PostMapping(value = "/camera-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CameraImageUploadResponse> ingest(
            @RequestHeader(value = ApiKeyGuard.HEADER, required = false) String key,
            @RequestParam String cameraCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant capturedAt,
            @RequestPart MultipartFile image) throws IOException {
        apiKey.require(key);
        CameraImageUploadResponse response = images.ingest(cameraCode, capturedAt, image.getBytes());
        return ResponseEntity.status(response.stored() ? HttpStatus.CREATED : HttpStatus.OK).body(response);
    }
}
