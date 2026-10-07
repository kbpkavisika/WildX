package com.wildx.wildx.dto;

import com.wildx.wildx.type.CameraImageStatus;
import jakarta.validation.constraints.*;

public record CameraImageTagRequest(@NotNull CameraImageStatus status,
                                    @Size(max = 255) String species,
                                    @Min(1) @Max(10000) Integer animalCount) {}
