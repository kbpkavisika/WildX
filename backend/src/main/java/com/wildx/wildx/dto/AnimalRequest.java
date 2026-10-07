package com.wildx.wildx.dto;

import jakarta.validation.constraints.*;

public record AnimalRequest(@NotBlank @Size(max = 255) String name,
                            @NotBlank @Size(max = 255) String species) {}
