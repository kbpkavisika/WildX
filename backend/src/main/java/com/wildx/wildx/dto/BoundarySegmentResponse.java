package com.wildx.wildx.dto;

import com.wildx.wildx.model.BoundarySegment;

public record BoundarySegmentResponse(
        Long id,
        Long parkId,
        String name,
        String code,
        Double centerLat,
        Double centerLng
) {
    public static BoundarySegmentResponse from(BoundarySegment segment) {
        return new BoundarySegmentResponse(
                segment.getId(),
                segment.getPark().getId(),
                segment.getName(),
                segment.getCode(),
                segment.getCenterLat(),
                segment.getCenterLng()
        );
    }
}
