package com.wildx.wildx.dto;

import jakarta.validation.constraints.*;

public record CameraSimulationRequest(@NotBlank @Size(max = 50) String cameraCode,
                                      @NotNull @Min(1) @Max(10) Integer count) {}
