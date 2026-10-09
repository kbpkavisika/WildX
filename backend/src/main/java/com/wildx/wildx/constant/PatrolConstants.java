package com.wildx.wildx.constant;

import java.time.Duration;
import java.time.ZoneId;

public final class PatrolConstants {
    public static final ZoneId PARK_ZONE = ZoneId.of("Asia/Colombo");
    public static final Duration DEVICE_CLOCK_SKEW = Duration.ofMinutes(2);
    private PatrolConstants() {}
}
