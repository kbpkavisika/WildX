package com.wildx.wildx.dto;

import jakarta.validation.constraints.*;

public record SectorRequest(@NotBlank @Size(max = 255) String name,
                            @NotBlank @Size(max = 100000) String polygonGeojson) {}
