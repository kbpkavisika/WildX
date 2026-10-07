package com.wildx.wildx.service;

import com.wildx.wildx.constant.AlertConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeviceHealthJob {
    private final DeviceHealthService health;

    @Scheduled(fixedDelay = AlertConstants.DEVICE_CHECK_INTERVAL_MS)
    public void run() {
        for (Long deviceId : health.reportedDeviceIds()) {
            try {
                health.check(deviceId);
            } catch (RuntimeException ex) {
                log.error("device health check failed deviceId={}", deviceId, ex);
            }
        }
    }
}
