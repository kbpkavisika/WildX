package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.AlertConstants;
import com.wildx.wildx.model.Alert;
import com.wildx.wildx.model.CollarFix;
import com.wildx.wildx.model.Device;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.CollarFixRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.service.AlertNotifier;
import com.wildx.wildx.service.DeviceHealthService;
import com.wildx.wildx.type.AlertStatus;
import com.wildx.wildx.type.AlertType;
import com.wildx.wildx.type.DeviceType;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.util.AlertText;
import com.wildx.wildx.util.GeoUtil.Point;
import com.wildx.wildx.util.PatrolMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceHealthServiceImpl implements DeviceHealthService {
    private final DeviceRepository devices;
    private final CollarFixRepository fixes;
    private final AlertRepository alerts;
    private final AlertNotifier notifier;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<Long> reportedDeviceIds() {
        return devices.findByLastSeenAtIsNotNullOrderByIdAsc().stream().map(Device::getId).toList();
    }

    @Override
    @Transactional
    public void check(Long deviceId) {
        Device device = devices.findById(deviceId).orElse(null);
        if (device == null || device.getLastSeenAt() == null) {
            return;
        }
        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        healthProblem(device, now)
                .filter(problem -> !hasUnresolved(device, AlertType.DEVICE_HEALTH))
                .ifPresent(problem -> raise(device, AlertType.DEVICE_HEALTH, AlertConstants.DEVICE_HEALTH_SEVERITY,
                        AlertConstants.DEVICE_HEALTH_ACK_SLA_MIN, now, problem));
        if (device.getType() == DeviceType.COLLAR && !hasUnresolved(device, AlertType.MORTALITY) && immobile(device)) {
            raise(device, AlertType.MORTALITY, AlertConstants.MORTALITY_SEVERITY, AlertConstants.MORTALITY_ACK_SLA_MIN,
                    now, "%s has moved less than %d m in %d h".formatted(AlertText.device(device),
                            AlertConstants.IMMOBILITY_RADIUS_M, AlertConstants.IMMOBILITY_WINDOW.toHours()));
        }
    }

    private boolean immobile(Device collar) {
        CollarFix latest = fixes.findFirstByDeviceIdOrderByRecordedAtDesc(collar.getId()).orElse(null);
        if (latest == null) {
            return false;
        }
        Instant windowStart = latest.getRecordedAt().minus(AlertConstants.IMMOBILITY_WINDOW);
        CollarFix anchor = fixes.findFirstByDeviceIdAndRecordedAtLessThanEqualOrderByRecordedAtDesc(collar.getId(),
                windowStart).orElse(null);
        if (anchor == null) {
            return false;
        }
        Point end = point(latest);
        return fixes.findByDeviceIdAndRecordedAtBetweenOrderByRecordedAtAsc(collar.getId(), anchor.getRecordedAt(),
                        latest.getRecordedAt()).stream()
                .allMatch(fix -> PatrolMetrics.between(point(fix), end) < AlertConstants.IMMOBILITY_RADIUS_M);
    }

    private Point point(CollarFix fix) {
        return new Point(fix.getLng(), fix.getLat());
    }

    private Optional<String> healthProblem(Device device, Instant now) {
        Duration silence = Duration.ofMinutes((long) device.getExpectedIntervalMin() * AlertConstants.SILENT_INTERVALS);
        if (device.getLastSeenAt().plus(silence).isBefore(now)) {
            return Optional.of("%s has not reported since %s".formatted(device.getCode(),
                    AlertText.time(device.getLastSeenAt())));
        }
        if (device.getBatteryPct() != null && device.getBatteryPct() < AlertConstants.LOW_BATTERY_PCT) {
            return Optional.of("%s battery is at %d%%".formatted(device.getCode(), device.getBatteryPct()));
        }
        return Optional.empty();
    }

    private boolean hasUnresolved(Device device, AlertType type) {
        return alerts.existsByDeviceIdAndTypeAndStatusNot(device.getId(), type, AlertStatus.RESOLVED);
    }

    private void raise(Device device, AlertType type, Severity severity, int ackSlaMin, Instant now, String body) {
        Alert alert = new Alert();
        alert.setPark(device.getPark());
        alert.setType(type);
        alert.setSeverity(severity);
        alert.setDevice(device);
        position(device).ifPresent(point -> {
            alert.setLat(point.lat());
            alert.setLng(point.lng());
        });
        alert.setStatus(AlertStatus.OPEN);
        alert.setOccurredAt(now);
        alert.setAckSlaMin(ackSlaMin);
        alert.setSlaDueAt(now.plus(Duration.ofMinutes(ackSlaMin)));
        alerts.save(alert);
        log.info("device alert raised alertId={} deviceId={} type={}", alert.getId(), device.getId(), type);
        notifier.notifyRaised(device.getPark().getId(), List.of(alert), raised -> body);
    }

    private Optional<Point> position(Device device) {
        if (device.getType() == DeviceType.CAMERA) {
            return device.getLat() == null ? Optional.empty() : Optional.of(new Point(device.getLng(), device.getLat()));
        }
        return fixes.findFirstByDeviceIdOrderByRecordedAtDesc(device.getId())
                .map(this::point);
    }
}
