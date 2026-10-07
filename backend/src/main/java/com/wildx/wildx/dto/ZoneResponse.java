package com.wildx.wildx.dto;

import com.wildx.wildx.model.Zone;
import com.wildx.wildx.type.ZoneType;

public record ZoneResponse(Long id, Long parkId, String name, ZoneType type, String polygonGeojson) {
    public static ZoneResponse from(Zone zone) {
        return new ZoneResponse(zone.getId(), zone.getPark().getId(), zone.getName(), zone.getType(),
                zone.getPolygonGeojson());
    }
}
