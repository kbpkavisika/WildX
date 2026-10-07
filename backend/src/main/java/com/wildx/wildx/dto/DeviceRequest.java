package com.wildx.wildx.dto;

import com.wildx.wildx.type.DeviceType;
import jakarta.validation.constraints.*;

public record DeviceRequest(@NotNull DeviceType type,
                            @NotBlank @Size(max = 50) String code,
                            @NotNull @Min(1) @Max(10080) Integer expectedIntervalMin,
                            Long animalId,
                            @DecimalMin("-90") @DecimalMax("90") Double lat,
                            @DecimalMin("-180") @DecimalMax("180") Double lng) {}
