package com.wildx.wildx.dto;

import jakarta.validation.constraints.Size;

public record DispatchDeclineRequest(
        @Size(max = 1000) String reason
) {}
