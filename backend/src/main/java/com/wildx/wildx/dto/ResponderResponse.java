package com.wildx.wildx.dto;

import java.time.Instant;

public record ResponderResponse(
        Long id,
        String name,
        String phone,
        Double lat,
        Double lng,
        Double distanceM,
        boolean offline,
        Instant lastSeenAt
) {}
