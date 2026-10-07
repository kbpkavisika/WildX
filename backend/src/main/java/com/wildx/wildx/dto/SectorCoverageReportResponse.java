package com.wildx.wildx.dto;

import java.time.Instant;

public record SectorCoverageReportResponse(Long sectorId, String sectorName, long pointCount,
                                           long patrolCount, Instant lastPatrolledAt) {}
