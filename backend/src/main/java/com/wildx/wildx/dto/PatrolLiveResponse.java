package com.wildx.wildx.dto;

import java.time.Instant;

public record PatrolLiveResponse(PatrolResponse patrol, TrackPointResponse lastPosition,
                                 Instant lastSeenAt, boolean offline) {}
