package com.wildx.wildx.dto;

import com.wildx.wildx.type.Severity;
import jakarta.validation.constraints.NotNull;

public record IncidentSeverityRequest(@NotNull Severity severity) {}
