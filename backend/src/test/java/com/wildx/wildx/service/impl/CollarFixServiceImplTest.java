package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.CollarFixRequest;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.service.AlertService;
import com.wildx.wildx.type.DeviceType;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CollarFixServiceImplTest {
    private static final Instant NOW = Instant.parse("2026-10-07T12:00:00Z");
    private final DeviceRepository devices = mock(DeviceRepository.class);
    private final CollarFixRepository fixes = mock(CollarFixRepository.class);
    private final AlertService alerts = mock(AlertService.class);
    private final CollarFixServiceImpl service =
            new CollarFixServiceImpl(devices, fixes, Clock.fixed(NOW, ZoneOffset.UTC), alerts);
    private final Device collar = device(DeviceType.COLLAR);

    @Test
    void storesNewFixAndUpdatesCollarState() {
        when(devices.findByCode("COL-001")).thenReturn(Optional.of(collar));
        var result = service.ingest(new CollarFixRequest(" COL-001 ", 6.31, 81.41, NOW.minusSeconds(60), 77));
        assertThat(result.stored()).isTrue();
        assertThat(result.deviceId()).isEqualTo(3L);
        ArgumentCaptor<CollarFix> saved = ArgumentCaptor.forClass(CollarFix.class);
        verify(fixes).save(saved.capture());
        assertThat(saved.getValue().getDevice()).isSameAs(collar);
        assertThat(saved.getValue().getLat()).isEqualTo(6.31);
        assertThat(saved.getValue().getLng()).isEqualTo(81.41);
        assertThat(saved.getValue().getBatteryPct()).isEqualTo(77);
        assertThat(collar.getLastSeenAt()).isEqualTo(NOW.minusSeconds(60));
        assertThat(collar.getBatteryPct()).isEqualTo(77);
        verify(alerts).raiseZoneBreaches(saved.getValue());
    }

    @Test
    void ignoresDuplicateCollarAndTimestamp() {
        when(devices.findByCode("COL-001")).thenReturn(Optional.of(collar));
        when(fixes.existsByDeviceIdAndRecordedAt(3L, NOW)).thenReturn(true);
        var result = service.ingest(new CollarFixRequest("COL-001", 6.31, 81.41, NOW, 77));
        assertThat(result.stored()).isFalse();
        verify(fixes, never()).save(any());
        verifyNoInteractions(alerts);
        assertThat(collar.getLastSeenAt()).isNull();
    }

    @Test
    void olderFixIsStoredWithoutRewindingCollarState() {
        collar.setLastSeenAt(NOW);
        collar.setBatteryPct(50);
        when(devices.findByCode("COL-001")).thenReturn(Optional.of(collar));
        assertThat(service.ingest(new CollarFixRequest("COL-001", 6.31, 81.41, NOW.minusSeconds(600), 90)).stored()).isTrue();
        verify(fixes).save(any());
        assertThat(collar.getLastSeenAt()).isEqualTo(NOW);
        assertThat(collar.getBatteryPct()).isEqualTo(50);
        verify(alerts).raiseZoneBreaches(any());
    }

    @Test
    void rejectsFutureFixesAndUnknownOrNonCollarCodes() {
        assertThatThrownBy(() -> service.ingest(new CollarFixRequest("COL-001", 6.31, 81.41, NOW.plusSeconds(1), 77)))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Fix timestamp must not be in the future");
        verifyNoInteractions(devices, fixes);
        when(devices.findByCode("NOPE")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.ingest(new CollarFixRequest("NOPE", 6.31, 81.41, NOW, 77)))
                .isInstanceOf(NotFoundException.class).hasMessage("Collar not found");
        when(devices.findByCode("CAM-001")).thenReturn(Optional.of(device(DeviceType.CAMERA)));
        assertThatThrownBy(() -> service.ingest(new CollarFixRequest("CAM-001", 6.31, 81.41, NOW, 77)))
                .isInstanceOf(NotFoundException.class);
        verify(fixes, never()).save(any());
    }

    private Device device(DeviceType type) {
        Device device = new Device();
        device.setId(3L);
        device.setPark(Park.builder().id(1L).name("Yala").code("YALA").build());
        device.setType(type);
        device.setCode(type == DeviceType.COLLAR ? "COL-001" : "CAM-001");
        device.setExpectedIntervalMin(15);
        return device;
    }
}
