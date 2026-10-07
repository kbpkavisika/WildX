package com.wildx.wildx.dto;

import jakarta.validation.constraints.NotNull;

public record PatrolGpsRequest(@NotNull Boolean available) {}
