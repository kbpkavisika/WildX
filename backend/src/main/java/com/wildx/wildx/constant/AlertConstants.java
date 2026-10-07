package com.wildx.wildx.constant;

import java.time.LocalTime;

public final class AlertConstants {
    public static final LocalTime NIGHT_START = LocalTime.of(18, 0);
    public static final LocalTime NIGHT_END = LocalTime.of(6, 0);

    private AlertConstants() {}

    public static boolean isNight(LocalTime time) {
        return !time.isBefore(NIGHT_START) || time.isBefore(NIGHT_END);
    }
}
