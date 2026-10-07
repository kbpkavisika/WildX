package com.wildx.wildx.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

public record PatrolTimeRequest(@NotNull Instant at) {
    public PatrolTimeRequest {
        at = at == null ? null : at.truncatedTo(ChronoUnit.MICROS);
    }
}
