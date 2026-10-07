package com.wildx.wildx.dto;

import com.wildx.wildx.model.TrackPoint;
import java.time.Instant;
import com.wildx.wildx.type.WaypointType;

public record TrackPointResponse(Long id, double lat, double lng, Double accuracyM, Instant recordedAt,
                                 boolean isWaypoint, String note, WaypointType waypointType, Long sectorId) {
    public static TrackPointResponse from(TrackPoint point) {
        return new TrackPointResponse(point.getId(), point.getLat(), point.getLng(), point.getAccuracyM(), point.getRecordedAt(),
                point.isWaypoint(), point.getNote(), point.getWaypointType(),
                point.getSector() == null ? null : point.getSector().getId());
    }
}

