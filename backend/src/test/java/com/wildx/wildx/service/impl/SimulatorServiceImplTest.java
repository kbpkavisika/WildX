package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.AlertConstants;
import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.service.CameraImageService;
import com.wildx.wildx.service.CollarFixService;
import com.wildx.wildx.type.DeviceType;
import com.wildx.wildx.type.SimulationScenario;
import com.wildx.wildx.util.GeoUtil;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SimulatorServiceImplTest {
    private static final Instant DAY = Instant.parse("2026-10-07T06:00:00Z");
    private static final Instant NIGHT = Instant.parse("2026-10-07T16:30:00Z");
    private static final String SQUARE = "{\"type\":\"Polygon\",\"coordinates\":[[[81.40,6.30],[81.42,6.30],[81.42,6.32],[81.40,6.32],[81.40,6.30]]]}";
    private static final String C_SHAPE = "{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[3,0],[3,1],[1,1],[1,2],[3,2],[3,3],[0,3],[0,0]]]}";
    private static final double METRES_PER_DEGREE = 111_320;
    private final DeviceRepository devices = mock(DeviceRepository.class);
    private final ZoneRepository zones = mock(ZoneRepository.class);
    private final CollarFixService collarFixes = mock(CollarFixService.class);
    private final CameraImageService cameraImages = mock(CameraImageService.class);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();

    @Test
    void singleFixAndLowBatterySendOneFixNow() {
        var service = service(DAY);
        stubCollar(DeviceType.COLLAR, park);
        var single = service.simulate(1L, request(SimulationScenario.SINGLE_FIX, 6.37, 81.51, null));
        var low = service.simulate(1L, request(SimulationScenario.LOW_BATTERY, 6.37, 81.51, null));
        assertThat(single).isEqualTo(new SimulationResponse(1, 1, 0));
        assertThat(low).isEqualTo(new SimulationResponse(1, 1, 0));
        List<CollarFixRequest> sent = sentFixes(2);
        assertThat(sent).extracting(CollarFixRequest::recordedAt).containsOnly(DAY);
        assertThat(sent).extracting(CollarFixRequest::batteryPct).containsExactly(80, 10);
        assertThat(sent.getFirst().lat()).isEqualTo(6.37);
        assertThat(sent.getFirst().lng()).isEqualTo(81.51);
    }

    @Test
    void keepsSubSecondPrecisionSoQuickRunsDoNotCollide() {
        Instant first = DAY.plusNanos(120_456_789);
        Instant second = DAY.plusNanos(870_000_001);
        stubCollar(DeviceType.COLLAR, park);
        service(first).simulate(1L, request(SimulationScenario.SINGLE_FIX, 6.37, 81.51, null));
        service(second).simulate(1L, request(SimulationScenario.SINGLE_FIX, 6.37, 81.51, null));
        assertThat(sentFixes(2)).extracting(CollarFixRequest::recordedAt)
                .containsExactly(DAY.plusNanos(120_456_000), DAY.plusNanos(870_000_000));
    }

    @Test
    void duplicateSendsTheSameFixTwice() {
        var service = service(DAY);
        stubCollar(DeviceType.COLLAR, park);
        when(collarFixes.ingest(any())).thenReturn(stored(true), stored(false));
        var result = service.simulate(1L, request(SimulationScenario.DUPLICATE, 6.37, 81.51, null));
        assertThat(result).isEqualTo(new SimulationResponse(2, 1, 1));
        List<CollarFixRequest> sent = sentFixes(2);
        assertThat(sent.get(0)).isEqualTo(sent.get(1));
    }

    @Test
    void notMovingCoversSixHoursWithinFiftyMetres() {
        var service = service(DAY);
        stubCollar(DeviceType.COLLAR, park);
        service.simulate(1L, request(SimulationScenario.NOT_MOVING, 6.37, 81.51, null));
        List<CollarFixRequest> sent = sentFixes(7);
        assertThat(sent.getFirst().recordedAt()).isEqualTo(DAY.minus(Duration.ofHours(6)));
        assertThat(sent.getLast().recordedAt()).isEqualTo(DAY);
        assertThat((sent.getLast().lat() - sent.getFirst().lat()) * METRES_PER_DEGREE).isLessThan(50);
    }

    @Test
    void walkEndsInsideTheZoneAfterStartingOutside() {
        var service = service(DAY);
        stubCollar(DeviceType.COLLAR, park);
        stubZone(SQUARE);
        service.simulate(1L, request(SimulationScenario.WALK_INTO_ZONE, null, null, 5L));
        List<CollarFixRequest> sent = sentFixes(6);
        assertThat(GeoUtil.contains(SQUARE, sent.getFirst().lat(), sent.getFirst().lng())).isFalse();
        assertThat(GeoUtil.contains(SQUARE, sent.getLast().lat(), sent.getLast().lng())).isTrue();
        assertThat(sent.getLast().lat()).isCloseTo(6.31, within(1e-9));
        assertThat(sent.getFirst().recordedAt()).isEqualTo(DAY.minus(Duration.ofMinutes(25)));
        assertThat(sent.getLast().recordedAt()).isEqualTo(DAY);
    }

    @Test
    void nightWalkEndsInNightHours() {
        stubCollar(DeviceType.COLLAR, park);
        stubZone(SQUARE);
        service(DAY).simulate(1L, request(SimulationScenario.NIGHT_WALK_INTO_ZONE, null, null, 5L));
        assertThat(sentFixes(6).getLast().recordedAt()).isEqualTo(DAY.minus(Duration.ofHours(12)));
        clearInvocations(collarFixes);
        service(NIGHT).simulate(1L, request(SimulationScenario.NIGHT_WALK_INTO_ZONE, null, null, 5L));
        Instant end = sentFixes(6).getLast().recordedAt();
        assertThat(end).isEqualTo(NIGHT);
        assertThat(AlertConstants.isNight(end.atZone(PatrolConstants.PARK_ZONE).toLocalTime())).isTrue();
        assertThat(AlertConstants.isNight(DAY.atZone(PatrolConstants.PARK_ZONE).toLocalTime())).isFalse();
    }

    @Test
    void rejectsMissingInputsAndForeignOrNonCollarDevices() {
        var service = service(DAY);
        stubCollar(DeviceType.COLLAR, park);
        assertThatThrownBy(() -> service.simulate(1L, request(SimulationScenario.SINGLE_FIX, 6.37, null, null)))
                .hasMessage("This scenario needs lat and lng");
        assertThatThrownBy(() -> service.simulate(1L, request(SimulationScenario.WALK_INTO_ZONE, null, null, null)))
                .hasMessage("This scenario needs a zoneId");
        when(zones.findByIdAndParkId(9L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.simulate(1L, request(SimulationScenario.WALK_INTO_ZONE, null, null, 9L)))
                .isInstanceOf(NotFoundException.class).hasMessage("Zone not found");
        stubZone(C_SHAPE);
        assertThatThrownBy(() -> service.simulate(1L, request(SimulationScenario.WALK_INTO_ZONE, null, null, 5L)))
                .hasMessage("The simulator cannot find a point inside this zone");
        assertThatThrownBy(() -> service.simulate(2L, request(SimulationScenario.SINGLE_FIX, 6.37, 81.51, null)))
                .isInstanceOf(NotFoundException.class).hasMessage("Collar not found");
        stubCollar(DeviceType.CAMERA, park);
        assertThatThrownBy(() -> service.simulate(1L, request(SimulationScenario.SINGLE_FIX, 6.37, 81.51, null)))
                .isInstanceOf(NotFoundException.class);
        verifyNoInteractions(collarFixes);
    }

    @Test
    void cameraBurstSendsRealJpegsTwentySecondsApartEndingNow() {
        var service = service(DAY);
        stubCamera(park);
        when(cameraImages.ingest(eq("CAM-001"), any(), any()))
                .thenReturn(upload(true), upload(true), upload(false));
        var result = service.simulateCamera(1L, new CameraSimulationRequest(" CAM-001 ", 3));
        assertThat(result).isEqualTo(new SimulationResponse(3, 2, 1));
        ArgumentCaptor<Instant> times = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<byte[]> files = ArgumentCaptor.forClass(byte[].class);
        verify(cameraImages, times(3)).ingest(eq("CAM-001"), times.capture(), files.capture());
        assertThat(times.getAllValues()).containsExactly(DAY.minusSeconds(40), DAY.minusSeconds(20), DAY);
        assertThat(files.getAllValues()).allSatisfy(jpeg -> {
            assertThat(jpeg.length).isGreaterThan(100);
            assertThat(Arrays.copyOf(jpeg, 3)).containsExactly(0xFF, 0xD8, 0xFF);
        });
        assertThat(files.getAllValues().get(0)).isNotEqualTo(files.getAllValues().get(2));
    }

    @Test
    void cameraSimulationRejectsForeignAndNonCameraDevices() {
        var service = service(DAY);
        stubCamera(Park.builder().id(2L).name("Wilpattu").code("WIL").build());
        assertThatThrownBy(() -> service.simulateCamera(1L, new CameraSimulationRequest("CAM-001", 2)))
                .isInstanceOf(NotFoundException.class).hasMessage("Camera not found");
        stubCollar(DeviceType.COLLAR, park);
        assertThatThrownBy(() -> service.simulateCamera(1L, new CameraSimulationRequest("COL-001", 2)))
                .isInstanceOf(NotFoundException.class);
        verifyNoInteractions(cameraImages);
    }

    private void stubCamera(Park owner) {
        Device camera = new Device();
        camera.setId(4L);
        camera.setPark(owner);
        camera.setType(DeviceType.CAMERA);
        camera.setCode("CAM-001");
        when(devices.findByCode("CAM-001")).thenReturn(Optional.of(camera));
    }

    private CameraImageUploadResponse upload(boolean stored) {
        return new CameraImageUploadResponse(40L, "CAM-001", DAY, stored);
    }

    private SimulatorServiceImpl service(Instant now) {
        when(collarFixes.ingest(any())).thenReturn(stored(true));
        return new SimulatorServiceImpl(devices, zones, collarFixes, Clock.fixed(now, ZoneOffset.UTC), cameraImages);
    }

    private void stubCollar(DeviceType type, Park owner) {
        Device device = new Device();
        device.setId(3L);
        device.setPark(owner);
        device.setType(type);
        device.setCode("COL-001");
        when(devices.findByCode("COL-001")).thenReturn(Optional.of(device));
    }

    private void stubZone(String polygon) {
        Zone zone = new Zone();
        zone.setId(5L);
        zone.setPark(park);
        zone.setPolygonGeojson(polygon);
        when(zones.findByIdAndParkId(5L, 1L)).thenReturn(Optional.of(zone));
    }

    private SimulationRequest request(SimulationScenario scenario, Double lat, Double lng, Long zoneId) {
        return new SimulationRequest(" COL-001 ", scenario, lat, lng, zoneId);
    }

    private CollarFixResponse stored(boolean stored) {
        return new CollarFixResponse(3L, "COL-001", DAY, stored);
    }

    private List<CollarFixRequest> sentFixes(int count) {
        ArgumentCaptor<CollarFixRequest> captor = ArgumentCaptor.forClass(CollarFixRequest.class);
        verify(collarFixes, times(count)).ingest(captor.capture());
        assertThat(captor.getAllValues()).extracting(CollarFixRequest::collarCode).containsOnly("COL-001");
        return captor.getAllValues();
    }
}
