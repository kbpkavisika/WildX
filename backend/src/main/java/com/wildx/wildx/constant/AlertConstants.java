package com.wildx.wildx.constant;

import com.wildx.wildx.type.Severity;
import java.time.Duration;
import java.time.LocalTime;

public final class AlertConstants {
    public static final LocalTime NIGHT_START = LocalTime.of(18, 0);
    public static final LocalTime NIGHT_END = LocalTime.of(6, 0);
    public static final long ESCALATION_INTERVAL_MS = 60_000;
    public static final long DEVICE_CHECK_INTERVAL_MS = 60_000;
    public static final int SILENT_INTERVALS = 3;
    public static final int LOW_BATTERY_PCT = 15;
    public static final Severity DEVICE_HEALTH_SEVERITY = Severity.MEDIUM;
    public static final int DEVICE_HEALTH_ACK_SLA_MIN = 60;
    public static final Duration IMMOBILITY_WINDOW = Duration.ofHours(6);
    public static final int IMMOBILITY_RADIUS_M = 50;
    public static final Severity MORTALITY_SEVERITY = Severity.CRITICAL;
    public static final int MORTALITY_ACK_SLA_MIN = 15;

    private AlertConstants() {}

    public static boolean isNight(LocalTime time) {
        return !time.isBefore(NIGHT_START) || time.isBefore(NIGHT_END);
    }
}
