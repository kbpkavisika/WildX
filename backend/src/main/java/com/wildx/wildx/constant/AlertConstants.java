package com.wildx.wildx.constant;

import com.wildx.wildx.type.Severity;
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

    private AlertConstants() {}

    public static boolean isNight(LocalTime time) {
        return !time.isBefore(NIGHT_START) || time.isBefore(NIGHT_END);
    }
}
