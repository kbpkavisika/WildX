package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.CollarFixRequest;
import com.wildx.wildx.dto.CollarFixResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.CollarFix;
import com.wildx.wildx.model.Device;
import com.wildx.wildx.repository.CollarFixRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.service.CollarFixService;
import com.wildx.wildx.type.DeviceType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;

@Slf4j
@Service
@RequiredArgsConstructor
public class CollarFixServiceImpl implements CollarFixService {
    private final DeviceRepository devices;
    private final CollarFixRepository fixes;
    private final Clock clock;

    @Override
    @Transactional
    public CollarFixResponse ingest(CollarFixRequest request) {
        log.info("ingest collar fix started collarCode={}", request.collarCode());
        if (request.recordedAt().isAfter(clock.instant())) {
            throw new IllegalArgumentException("Fix timestamp must not be in the future");
        }
        Device collar = devices.findByCode(request.collarCode().strip())
                .filter(device -> device.getType() == DeviceType.COLLAR)
                .orElseThrow(() -> new NotFoundException("Collar not found"));
        if (fixes.existsByDeviceIdAndRecordedAt(collar.getId(), request.recordedAt())) {
            log.info("ingest collar fix ignored duplicate deviceId={}", collar.getId());
            return new CollarFixResponse(collar.getId(), collar.getCode(), request.recordedAt(), false);
        }
        fixes.save(fix(collar, request));
        if (collar.getLastSeenAt() == null || request.recordedAt().isAfter(collar.getLastSeenAt())) {
            collar.setLastSeenAt(request.recordedAt());
            collar.setBatteryPct(request.batteryPct());
        }
        log.info("ingest collar fix completed deviceId={}", collar.getId());
        return new CollarFixResponse(collar.getId(), collar.getCode(), request.recordedAt(), true);
    }

    private CollarFix fix(Device collar, CollarFixRequest request) {
        CollarFix fix = new CollarFix();
        fix.setDevice(collar);
        fix.setLat(request.lat());
        fix.setLng(request.lng());
        fix.setBatteryPct(request.batteryPct());
        fix.setRecordedAt(request.recordedAt());
        return fix;
    }
}
