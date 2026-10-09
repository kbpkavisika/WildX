package com.wildx.wildx.dto;

import com.wildx.wildx.type.LocationSource;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.UUID;

public record IncidentCreateRequest(@NotNull Long typeId,
                                    @NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
                                    @NotNull @DecimalMin("-180") @DecimalMax("180") Double lng,
                                    @NotNull LocationSource locationSource,
                                    @Size(max = 500) String description,
                                    Instant occurredAt,
                                    UUID clientId) {}
