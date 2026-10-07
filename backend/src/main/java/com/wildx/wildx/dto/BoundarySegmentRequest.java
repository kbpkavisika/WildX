package com.wildx.wildx.dto;

import jakarta.validation.constraints.*;

public record BoundarySegmentRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9_]{2,20}$", message = "Landmark code must be 2-20 alphanumeric characters") String code,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double centerLat,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double centerLng
) {}
