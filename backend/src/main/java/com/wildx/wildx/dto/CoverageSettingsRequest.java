package com.wildx.wildx.dto;

import jakarta.validation.constraints.*;

public record CoverageSettingsRequest(@NotNull @Min(1) @Max(3650) Integer neglectDays) {}
