package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.Animal;
import com.wildx.wildx.model.Device;
import com.wildx.wildx.repository.AnimalRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.service.DeviceService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.DeviceType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceServiceImpl implements DeviceService {
    private final ParkService parks;
    private final AnimalRepository animals;
    private final DeviceRepository devices;

    @Override
    @Transactional(readOnly = true)
    public List<AnimalResponse> animals(Long parkId) {
        log.info("list animals started parkId={}", parkId);
        var response = animals.findByParkIdOrderByNameAscIdAsc(parkId).stream().map(AnimalResponse::from).toList();
        log.info("list animals completed parkId={}", parkId);
        return response;
    }

    @Override
    @Transactional
    public AnimalResponse createAnimal(Long parkId, AnimalRequest request) {
        log.info("create animal started parkId={}", parkId);
        Animal animal = new Animal();
        animal.setPark(parks.require(parkId));
        apply(animal, request);
        AnimalResponse response = AnimalResponse.from(animals.save(animal));
        log.info("create animal completed animalId={}", response.id());
        return response;
    }

    @Override
    @Transactional
    public AnimalResponse updateAnimal(Long parkId, Long animalId, AnimalRequest request) {
        log.info("update animal started animalId={}", animalId);
        Animal animal = requireAnimal(parkId, animalId);
        apply(animal, request);
        log.info("update animal completed animalId={}", animalId);
        return AnimalResponse.from(animal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeviceResponse> devices(Long parkId) {
        log.info("list devices started parkId={}", parkId);
        var response = devices.findByParkIdOrderByCodeAsc(parkId).stream().map(DeviceResponse::from).toList();
        log.info("list devices completed parkId={}", parkId);
        return response;
    }

    @Override
    @Transactional
    public DeviceResponse createDevice(Long parkId, DeviceRequest request) {
        log.info("create device started parkId={}", parkId);
        String code = uniqueCode(request.code(), null);
        Animal animal = linkedAnimal(parkId, request);
        Device device = new Device();
        device.setPark(parks.require(parkId));
        device.setType(request.type());
        apply(device, request, code, animal);
        DeviceResponse response = DeviceResponse.from(devices.save(device));
        log.info("create device completed deviceId={}", response.id());
        return response;
    }

    @Override
    @Transactional
    public DeviceResponse updateDevice(Long parkId, Long deviceId, DeviceRequest request) {
        log.info("update device started deviceId={}", deviceId);
        Device device = devices.findByIdAndParkId(deviceId, parkId)
                .orElseThrow(() -> new NotFoundException("Device not found"));
        if (device.getType() != request.type()) {
            throw new IllegalArgumentException("Device type cannot change");
        }
        String code = uniqueCode(request.code(), deviceId);
        apply(device, request, code, linkedAnimal(parkId, request));
        log.info("update device completed deviceId={}", deviceId);
        return DeviceResponse.from(device);
    }

    private String uniqueCode(String code, Long deviceId) {
        String stripped = code.strip();
        devices.findByCode(stripped).filter(existing -> !Objects.equals(existing.getId(), deviceId))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Device code already exists");
                });
        return stripped;
    }

    private Animal linkedAnimal(Long parkId, DeviceRequest request) {
        if (request.type() == DeviceType.CAMERA) {
            if (request.lat() == null || request.lng() == null) {
                throw new IllegalArgumentException("Camera trap requires a location");
            }
            return null;
        }
        if (request.animalId() == null) {
            throw new IllegalArgumentException("Collar requires an animal");
        }
        return requireAnimal(parkId, request.animalId());
    }

    private Animal requireAnimal(Long parkId, Long animalId) {
        return animals.findByIdAndParkId(animalId, parkId).orElseThrow(() -> new NotFoundException("Animal not found"));
    }

    private void apply(Animal animal, AnimalRequest request) {
        animal.setName(request.name().strip());
        animal.setSpecies(request.species().strip());
    }

    private void apply(Device device, DeviceRequest request, String code, Animal animal) {
        boolean camera = request.type() == DeviceType.CAMERA;
        device.setCode(code);
        device.setExpectedIntervalMin(request.expectedIntervalMin());
        device.setAnimal(animal);
        device.setLat(camera ? request.lat() : null);
        device.setLng(camera ? request.lng() : null);
    }
}
