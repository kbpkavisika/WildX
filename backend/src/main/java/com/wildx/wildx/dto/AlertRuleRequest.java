package com.wildx.wildx.dto;

import com.wildx.wildx.type.Severity;
import jakarta.validation.constraints.*;

public record AlertRuleRequest(@NotNull Severity severity,
                               @NotNull @Min(0) @Max(1440) Integer cooldownMin,
                               @NotNull @Min(1) @Max(1440) Integer ackSlaMin) {}
