package com.wildx.wildx.dto;

import com.wildx.wildx.model.Incident;
import com.wildx.wildx.type.IncidentStatus;
import com.wildx.wildx.type.LocationSource;
import com.wildx.wildx.type.Severity;
import java.time.Instant;

public record IncidentResponse(Long id, Long parkId, Long typeId, String typeName, Long reporterId, String reporterName,
                               Long patrolId, Double lat, Double lng, LocationSource locationSource, Long sectorId, String sectorName,
                               String description, String photoPath, Severity severity, IncidentStatus status,
                               Instant occurredAt, String resolutionNote) {
    public static IncidentResponse from(Incident incident) {
        return new IncidentResponse(incident.getId(), incident.getPark().getId(), incident.getType().getId(),
                incident.getType().getName(), incident.getReporter().getId(), incident.getReporter().getName(),
                incident.getPatrol() == null ? null : incident.getPatrol().getId(), incident.getLat(), incident.getLng(), incident.getLocationSource(),
                incident.getSector() == null ? null : incident.getSector().getId(),
                incident.getSector() == null ? null : incident.getSector().getName(),
                incident.getDescription(), incident.getPhotoPath(), incident.getSeverity(), incident.getStatus(),
                incident.getOccurredAt(), incident.getResolutionNote());
    }
}
