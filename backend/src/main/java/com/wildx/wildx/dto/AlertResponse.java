package com.wildx.wildx.dto;

import com.wildx.wildx.model.Alert;
import com.wildx.wildx.type.AlertStatus;
import com.wildx.wildx.type.AlertType;
import com.wildx.wildx.type.Disposition;
import com.wildx.wildx.type.Severity;
import java.time.Instant;

public record AlertResponse(Long id, AlertType type, Severity severity, AlertStatus status, Long deviceId,
                            String collarCode, String animalName, Long zoneId, String zoneName, Double lat,
                            Double lng, Instant occurredAt, Instant slaDueAt, String acknowledgedByName,
                            Instant acknowledgedAt, Instant resolvedAt, Disposition disposition,
                            int escalationLevel, Long cameraImageId) {
    public static AlertResponse from(Alert alert) {
        var device = alert.getDevice();
        var animal = device == null ? null : device.getAnimal();
        var zone = alert.getZone();
        var acknowledgedBy = alert.getAcknowledgedBy();
        var cameraImage = alert.getCameraImage();
        return new AlertResponse(alert.getId(), alert.getType(), alert.getSeverity(), alert.getStatus(),
                device == null ? null : device.getId(), device == null ? null : device.getCode(),
                animal == null ? null : animal.getName(), zone == null ? null : zone.getId(),
                zone == null ? null : zone.getName(), alert.getLat(), alert.getLng(), alert.getOccurredAt(),
                alert.getSlaDueAt(), acknowledgedBy == null ? null : acknowledgedBy.getName(),
                alert.getAcknowledgedAt(), alert.getResolvedAt(), alert.getDisposition(), alert.getEscalationLevel(),
                cameraImage == null ? null : cameraImage.getId());
    }
}
