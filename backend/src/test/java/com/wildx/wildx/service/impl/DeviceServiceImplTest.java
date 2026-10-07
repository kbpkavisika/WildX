package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.DeviceType;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DeviceServiceImplTest {
    private final ParkService parks = mock(ParkService.class);
    private final AnimalRepository animals = mock(AnimalRepository.class);
    private final DeviceRepository devices = mock(DeviceRepository.class);
    private final DeviceServiceImpl service = new DeviceServiceImpl(parks, animals, devices);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();

    @Test
    void createsListsAndUpdatesAnimals() {
        when(parks.require(1L)).thenReturn(park);
        when(animals.save(any())).thenAnswer(call -> {
            Animal animal = call.getArgument(0);
            animal.setId(5L);
            return animal;
        });
        var created = service.createAnimal(1L, new AnimalRequest(" Gemunu ", " Asian elephant "));
        assertThat(created).isEqualTo(new AnimalResponse(5L, 1L, "Gemunu", "Asian elephant"));

        Animal animal = animal();
        when(animals.findByParkIdOrderByNameAscIdAsc(1L)).thenReturn(List.of(animal));
        assertThat(service.animals(1L)).extracting(AnimalResponse::name).containsExactly("Gemunu");
        when(animals.findByIdAndParkId(5L, 1L)).thenReturn(Optional.of(animal));
        assertThat(service.updateAnimal(1L, 5L, new AnimalRequest("Raja", "Asian elephant")).name()).isEqualTo("Raja");
        assertThatThrownBy(() -> service.updateAnimal(1L, 6L, new AnimalRequest("Raja", "Asian elephant")))
                .isInstanceOf(NotFoundException.class).hasMessage("Animal not found");
    }

    @Test
    void registersCollarLinkedToParkAnimalAndIgnoresLocation() {
        when(parks.require(1L)).thenReturn(park);
        when(animals.findByIdAndParkId(5L, 1L)).thenReturn(Optional.of(animal()));
        when(devices.findByCode("COL-001")).thenReturn(Optional.empty());
        when(devices.save(any())).thenAnswer(call -> {
            Device device = call.getArgument(0);
            device.setId(9L);
            return device;
        });
        var result = service.createDevice(1L, new DeviceRequest(DeviceType.COLLAR, " COL-001 ", 15, 5L, 6.0, 81.0));
        assertThat(result.code()).isEqualTo("COL-001");
        assertThat(result.type()).isEqualTo(DeviceType.COLLAR);
        assertThat(result.expectedIntervalMin()).isEqualTo(15);
        assertThat(result.animal().name()).isEqualTo("Gemunu");
        assertThat(result.lat()).isNull();
        assertThat(result.lng()).isNull();
    }

    @Test
    void registersCameraWithLocationAndNoAnimal() {
        when(parks.require(1L)).thenReturn(park);
        when(devices.findByCode("CAM-001")).thenReturn(Optional.empty());
        when(devices.save(any())).thenAnswer(call -> call.getArgument(0));
        var result = service.createDevice(1L, new DeviceRequest(DeviceType.CAMERA, "CAM-001", 60, 5L, 6.37, 81.51));
        assertThat(result.animal()).isNull();
        assertThat(result.lat()).isEqualTo(6.37);
        assertThat(result.lng()).isEqualTo(81.51);
        verifyNoInteractions(animals);
    }

    @Test
    void rejectsInvalidRegistrationsBeforeSaving() {
        assertThatThrownBy(() -> service.createDevice(1L, new DeviceRequest(DeviceType.CAMERA, "CAM-1", 60, null, null, 81.0)))
                .hasMessage("Camera trap requires a location");
        assertThatThrownBy(() -> service.createDevice(1L, new DeviceRequest(DeviceType.COLLAR, "COL-1", 15, null, null, null)))
                .hasMessage("Collar requires an animal");
        when(animals.findByIdAndParkId(8L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createDevice(1L, new DeviceRequest(DeviceType.COLLAR, "COL-1", 15, 8L, null, null)))
                .hasMessage("Animal not found");
        Device existing = device(3L, DeviceType.COLLAR);
        when(devices.findByCode("COL-1")).thenReturn(Optional.of(existing));
        assertThatThrownBy(() -> service.createDevice(1L, new DeviceRequest(DeviceType.COLLAR, "COL-1", 15, 5L, null, null)))
                .hasMessage("Device code already exists");
        verify(devices, never()).save(any());
    }

    @Test
    void updatesDeviceKeepingTypeAndOwnCode() {
        Device camera = device(4L, DeviceType.CAMERA);
        when(devices.findByIdAndParkId(4L, 1L)).thenReturn(Optional.of(camera));
        when(devices.findByCode("CAM-9")).thenReturn(Optional.of(camera));
        var result = service.updateDevice(1L, 4L, new DeviceRequest(DeviceType.CAMERA, "CAM-9", 30, null, 6.5, 81.6));
        assertThat(result.expectedIntervalMin()).isEqualTo(30);
        assertThat(result.lat()).isEqualTo(6.5);
        assertThatThrownBy(() -> service.updateDevice(1L, 4L, new DeviceRequest(DeviceType.COLLAR, "CAM-9", 30, 5L, null, null)))
                .hasMessage("Device type cannot change");
        assertThatThrownBy(() -> service.updateDevice(1L, 7L, new DeviceRequest(DeviceType.CAMERA, "CAM-9", 30, null, 6.5, 81.6)))
                .isInstanceOf(NotFoundException.class).hasMessage("Device not found");
    }

    @Test
    void listsParkDevices() {
        when(devices.findByParkIdOrderByCodeAsc(1L)).thenReturn(List.of(device(4L, DeviceType.CAMERA)));
        assertThat(service.devices(1L)).extracting(DeviceResponse::id).containsExactly(4L);
    }

    private Animal animal() {
        Animal animal = new Animal();
        animal.setId(5L);
        animal.setPark(park);
        animal.setName("Gemunu");
        animal.setSpecies("Asian elephant");
        return animal;
    }

    private Device device(Long id, DeviceType type) {
        Device device = new Device();
        device.setId(id);
        device.setPark(park);
        device.setType(type);
        device.setCode("CAM-9");
        device.setExpectedIntervalMin(60);
        return device;
    }
}
