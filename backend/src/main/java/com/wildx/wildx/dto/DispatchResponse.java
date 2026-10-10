package com.wildx.wildx.dto;

import com.wildx.wildx.model.Dispatch;
import com.wildx.wildx.type.DispatchStatus;
import com.wildx.wildx.type.SourceType;

import java.time.Instant;

public record DispatchResponse(
        Long id,
        SourceType sourceType,
        Long sourceId,
        Long responderId,
        String responderName,
        Long assignedById,
        String assignedByName,
        DispatchStatus status,
        Instant assignedAt,
        Instant acknowledgedAt,
        Instant completedAt,
        String outcome,
        String note,
        Double lat,
        Double lng
) {
    public static DispatchResponse from(Dispatch dispatch, Double lat, Double lng) {
        return new DispatchResponse(
                dispatch.getId(),
                dispatch.getSourceType(),
                dispatch.getSourceId(),
                dispatch.getResponder().getId(),
                dispatch.getResponder().getName(),
                dispatch.getAssignedBy() != null ? dispatch.getAssignedBy().getId() : null,
                dispatch.getAssignedBy() != null ? dispatch.getAssignedBy().getName() : null,
                dispatch.getStatus(),
                dispatch.getAssignedAt(),
                dispatch.getAcknowledgedAt(),
                dispatch.getCompletedAt(),
                dispatch.getOutcome(),
                dispatch.getNote(),
                lat,
                lng
        );
    }
}
