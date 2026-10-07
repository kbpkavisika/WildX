package com.wildx.wildx.dto;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import com.wildx.wildx.type.WaypointType;

public record PatrolPointRequest(@NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
                                 @NotNull @DecimalMin("-180") @DecimalMax("180") Double lng,
                                 @PositiveOrZero Double accuracyM, @NotNull Instant recordedAt,
                                 Boolean isWaypoint, @Size(max = 1000) String note, WaypointType waypointType) {
    public PatrolPointRequest {
        recordedAt = recordedAt == null ? null : recordedAt.truncatedTo(ChronoUnit.MICROS);
        isWaypoint = Boolean.TRUE.equals(isWaypoint);
    }
}

