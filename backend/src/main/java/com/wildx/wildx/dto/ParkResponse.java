package com.wildx.wildx.dto;

import com.wildx.wildx.model.Park;

public record ParkResponse(Long id, String name, String code, int neglectDays) {
    public static ParkResponse from(Park park) {
        return new ParkResponse(park.getId(), park.getName(), park.getCode(), park.getNeglectDays());
    }
}
