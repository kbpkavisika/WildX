package com.wildx.wildx.dto;

import com.wildx.wildx.type.Disposition;
import jakarta.validation.constraints.NotNull;

public record AlertResolveRequest(@NotNull Disposition disposition) {}
