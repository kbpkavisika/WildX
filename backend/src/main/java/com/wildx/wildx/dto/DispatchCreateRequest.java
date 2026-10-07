package com.wildx.wildx.dto;

import com.wildx.wildx.type.SourceType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DispatchCreateRequest(
        @NotNull SourceType sourceType,
        @NotNull Long sourceId,
        @NotNull Long responderId,
        @Size(max = 1000) String note
) {}
