package com.wildx.wildx.dto;

import com.wildx.wildx.model.PatrolRoute;

public record PatrolRouteResponse(Long id, Long parkId, String name, String pathGeojson) {
    public static PatrolRouteResponse from(PatrolRoute route) {
        return new PatrolRouteResponse(route.getId(), route.getPark().getId(), route.getName(), route.getPathGeojson());
    }
}

