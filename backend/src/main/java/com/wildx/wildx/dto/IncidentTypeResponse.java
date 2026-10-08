package com.wildx.wildx.dto;

import com.wildx.wildx.model.IncidentType;
import com.wildx.wildx.type.Severity;

public record IncidentTypeResponse(Long id, Long parkId, String name, Severity defaultSeverity, boolean active) {
    public static IncidentTypeResponse from(IncidentType type) {
        return new IncidentTypeResponse(type.getId(), type.getPark().getId(), type.getName(),
                type.getDefaultSeverity(), type.isActive());
    }
}
