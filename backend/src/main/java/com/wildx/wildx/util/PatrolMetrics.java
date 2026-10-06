package com.wildx.wildx.util;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

public final class PatrolMetrics {
    private static final double EARTH_RADIUS_METRES = 6371000;

    private PatrolMetrics() {}

    public static double distance(List<GeoUtil.Point> points) {
        double total = 0;
        for (int i = 1; i < points.size(); i++) {
            total += between(points.get(i - 1), points.get(i));
        }
        return total;
    }

    public static double between(GeoUtil.Point a, GeoUtil.Point b) {
        double latDifference = Math.toRadians(b.lat() - a.lat());
        double lngDifference = Math.toRadians(b.lng() - a.lng());
        double haversine = Math.pow(Math.sin(latDifference / 2), 2)
                + Math.cos(Math.toRadians(a.lat())) * Math.cos(Math.toRadians(b.lat()))
                * Math.pow(Math.sin(lngDifference / 2), 2);
        return 2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(Math.min(1, haversine)));
    }

    public static long duration(Instant start, Instant end) {
        if (start == null || end == null) {
            return 0;
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("End time must follow start time");
        }
        return Duration.between(start, end).getSeconds();
    }
}
