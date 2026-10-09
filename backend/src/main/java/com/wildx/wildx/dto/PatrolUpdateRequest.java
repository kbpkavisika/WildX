package com.wildx.wildx.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record PatrolUpdateRequest(@NotNull @Positive Long routeId,
                                  @NotNull @Positive Long rangerId,
                                  @NotNull LocalDate scheduledDate) {}
