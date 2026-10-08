package com.wildx.wildx.dto;

import com.wildx.wildx.model.CameraImage;
import com.wildx.wildx.type.CameraImageStatus;
import java.time.Instant;

public record CameraImageResponse(Long id, String cameraCode, Instant capturedAt, CameraImageStatus status,
                                  String species, Integer animalCount, String reviewedByName, Instant reviewedAt) {
    public static CameraImageResponse from(CameraImage image) {
        var reviewer = image.getReviewedBy();
        return new CameraImageResponse(image.getId(), image.getDevice().getCode(), image.getCapturedAt(),
                image.getStatus(), image.getSpecies(), image.getAnimalCount(),
                reviewer == null ? null : reviewer.getName(), image.getReviewedAt());
    }
}
