package com.wildx.wildx.dto;

import com.wildx.wildx.type.Severity;
import jakarta.validation.constraints.*;

public record IncidentTypeRequest(@NotBlank @Size(max = 100) String name,
                                  @NotNull Severity defaultSeverity,
                                  @NotNull Boolean active) {}
