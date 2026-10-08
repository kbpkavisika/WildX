package com.wildx.wildx.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

public record ReportLocationUpdateRequest(
        Long segmentId,
        @Size(max = 20) String landmarkCode,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double lat,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double lng
) {}
