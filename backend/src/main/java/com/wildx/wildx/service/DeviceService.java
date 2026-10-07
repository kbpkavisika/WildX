package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import java.util.List;

public interface DeviceService {
    List<AnimalResponse> animals(Long parkId);
    AnimalResponse createAnimal(Long parkId, AnimalRequest request);
    AnimalResponse updateAnimal(Long parkId, Long animalId, AnimalRequest request);
    List<DeviceResponse> devices(Long parkId);
    DeviceResponse createDevice(Long parkId, DeviceRequest request);
    DeviceResponse updateDevice(Long parkId, Long deviceId, DeviceRequest request);
}
