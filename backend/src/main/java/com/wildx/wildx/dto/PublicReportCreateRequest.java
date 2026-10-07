package com.wildx.wildx.dto;

import com.wildx.wildx.type.ReportType;
import jakarta.validation.constraints.*;

public record PublicReportCreateRequest(
        @NotNull Long parkId,
        @NotNull ReportType type,
        @Min(1) @Max(1000) Integer animalCount,
        @Size(max = 2000) String description,
        @NotBlank @Size(max = 50) String reporterPhone,
        @Size(max = 20) String landmarkCode,
        Long segmentId,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double lat,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double lng
) {}
