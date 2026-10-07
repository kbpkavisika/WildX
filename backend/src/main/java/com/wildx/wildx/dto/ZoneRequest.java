package com.wildx.wildx.dto;

import com.wildx.wildx.type.ZoneType;
import jakarta.validation.constraints.*;

public record ZoneRequest(@NotBlank @Size(max = 255) String name,
                          @NotNull ZoneType type,
                          @NotBlank @Size(max = 100000) String polygonGeojson) {}
