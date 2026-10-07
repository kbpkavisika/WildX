package com.wildx.wildx.dto;

import com.wildx.wildx.model.Sector;

public record SectorResponse(Long id, Long parkId, String name, String polygonGeojson) {
    public static SectorResponse from(Sector sector) {
        return new SectorResponse(sector.getId(), sector.getPark().getId(), sector.getName(), sector.getPolygonGeojson());
    }
}
