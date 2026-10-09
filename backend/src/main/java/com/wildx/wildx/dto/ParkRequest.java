package com.wildx.wildx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ParkRequest(@NotBlank @Size(max = 255) String name, @NotBlank @Size(max = 20) String code) {}
