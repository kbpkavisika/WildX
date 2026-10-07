package com.wildx.wildx.dto;

import com.wildx.wildx.type.Severity;
import jakarta.validation.constraints.NotNull;

public record ReportValidateRequest(
        @NotNull Severity severity
) {}
