package com.wildx.wildx.dto;

import com.wildx.wildx.model.Incident;
import com.wildx.wildx.type.IncidentStatus;
import com.wildx.wildx.type.Severity;
import java.time.Instant;

public record IncidentReportPoint(Long id, Instant occurredAt, String typeName, String sectorName, Severity severity,
                                  IncidentStatus status, Double lat, Double lng) {
    public static IncidentReportPoint from(Incident incident) {
        return new IncidentReportPoint(incident.getId(), incident.getOccurredAt(), incident.getType().getName(),
                incident.getSector() == null ? null : incident.getSector().getName(), incident.getSeverity(),
                incident.getStatus(), incident.getLat(), incident.getLng());
    }
}
