package com.wildx.wildx.dto;

import com.wildx.wildx.model.Device;
import com.wildx.wildx.type.DeviceType;

public record DeviceResponse(Long id, Long parkId, DeviceType type, String code, int expectedIntervalMin,
                             AnimalResponse animal, Double lat, Double lng) {
    public static DeviceResponse from(Device device) {
        AnimalResponse animal = device.getAnimal() == null ? null : AnimalResponse.from(device.getAnimal());
        return new DeviceResponse(device.getId(), device.getPark().getId(), device.getType(), device.getCode(),
                device.getExpectedIntervalMin(), animal, device.getLat(), device.getLng());
    }
}
