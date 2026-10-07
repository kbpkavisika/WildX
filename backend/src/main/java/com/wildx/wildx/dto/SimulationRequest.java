package com.wildx.wildx.dto;

import com.wildx.wildx.type.SimulationScenario;
import jakarta.validation.constraints.*;

public record SimulationRequest(@NotBlank @Size(max = 50) String collarCode,
                                @NotNull SimulationScenario scenario,
                                @DecimalMin("-90") @DecimalMax("90") Double lat,
                                @DecimalMin("-180") @DecimalMax("180") Double lng,
                                Long zoneId) {}
