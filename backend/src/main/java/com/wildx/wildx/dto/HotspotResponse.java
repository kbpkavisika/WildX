package com.wildx.wildx.dto;

public record HotspotResponse(
        Long segmentId,
        String segmentName,
        String segmentCode,
        Double centerLat,
        Double centerLng,
        long conflictCount,
        int threshold,
        boolean hotspot
) {}
