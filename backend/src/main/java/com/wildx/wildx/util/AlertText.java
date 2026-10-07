package com.wildx.wildx.util;

import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.model.Alert;
import com.wildx.wildx.model.Device;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public final class AlertText {
    private static final DateTimeFormatter PARK_TIME =
            DateTimeFormatter.ofPattern("HH:mm").withZone(PatrolConstants.PARK_ZONE);

    private AlertText() {}

    public static String title(String prefix, Alert alert) {
        String type = alert.getType().name().toLowerCase(Locale.ROOT).replace('_', ' ');
        return prefix + " " + alert.getSeverity() + " " + type + " alert";
    }

    public static String subject(Alert alert) {
        if (alert.getDevice() == null) {
            return "Alert " + alert.getId();
        }
        String device = device(alert.getDevice());
        return alert.getZone() == null ? device : device + " in " + alert.getZone().getName();
    }

    public static String device(Device device) {
        return device.getAnimal() == null
                ? device.getCode()
                : "%s (%s)".formatted(device.getAnimal().getName(), device.getCode());
    }

    public static String time(Instant instant) {
        return PARK_TIME.format(instant);
    }
}
