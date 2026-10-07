package com.wildx.wildx.dto;

import java.time.Instant;

public record SectorCoverageResponse(Long sectorId, String sectorName, String polygonGeojson,
                                     Instant lastPatrolledAt, Long daysSinceLastPatrol, boolean neglected) {}
