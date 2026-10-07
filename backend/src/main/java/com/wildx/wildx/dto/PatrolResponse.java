package com.wildx.wildx.dto;

import com.wildx.wildx.model.Patrol;
import com.wildx.wildx.type.PatrolStatus;
import java.time.*;

public record PatrolResponse(Long id, PatrolRouteResponse route, Long rangerId, String rangerName,
                             LocalDate scheduledDate, PatrolStatus status, Instant startedAt,
                             Instant endedAt, boolean gpsAvailable) {
    public static PatrolResponse from(Patrol patrol) {
        return new PatrolResponse(patrol.getId(), PatrolRouteResponse.from(patrol.getRoute()),
                patrol.getRanger().getId(), patrol.getRanger().getName(), patrol.getScheduledDate(),
                patrol.getStatus(), patrol.getStartedAt(), patrol.getEndedAt(), patrol.isGpsAvailable());
    }
}
