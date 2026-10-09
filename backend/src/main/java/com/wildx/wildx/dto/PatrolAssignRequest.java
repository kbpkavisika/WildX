package com.wildx.wildx.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public record PatrolAssignRequest(@NotNull @Positive Long routeId,
                                  @NotEmpty @Size(max = 50) List<@NotNull @Positive Long> rangerIds,
                                  @NotNull LocalDate scheduledDate) {}
