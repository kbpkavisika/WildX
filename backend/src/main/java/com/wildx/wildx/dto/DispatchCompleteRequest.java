package com.wildx.wildx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DispatchCompleteRequest(
        @NotBlank @Size(max = 1000) String outcome
) {}
