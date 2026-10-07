package com.wildx.wildx.dto;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

public record CollarFixRequest(@NotBlank @Size(max = 50) String collarCode,
                               @NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
                               @NotNull @DecimalMin("-180") @DecimalMax("180") Double lng,
                               @NotNull Instant recordedAt,
                               @NotNull @Min(0) @Max(100) Integer batteryPct) {
    public CollarFixRequest {
        recordedAt = recordedAt == null ? null : recordedAt.truncatedTo(ChronoUnit.MICROS);
    }
}
