package com.wildx.wildx.util;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.util.ArrayList;
import java.util.List;

public final class GeoUtil {
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final int LONGITUDE_LIMIT = 180;
    private static final int LATITUDE_LIMIT = 90;

    private GeoUtil() {}

    public record Point(double lng, double lat) {}

    public static List<Point> line(String geoJson) {
        JsonNode geometry = geometry(geoJson, "LineString");
        List<Point> points = points(geometry.get("coordinates"));
        if (points.size() < 2) {
            throw new IllegalArgumentException("A route needs at least two points");
        }
        return points;
    }

    private static JsonNode geometry(String geoJson, String type) {
        try {
            JsonNode geometry = JSON.readTree(geoJson);
            if (geometry == null || !type.equals(geometry.path("type").asString())) {
                throw new IllegalArgumentException("Expected GeoJSON " + type);
            }
            return geometry;
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Invalid GeoJSON " + type, ex);
        }
    }

    private static List<Point> points(JsonNode coordinates) {
        if (coordinates == null || !coordinates.isArray()) {
            throw new IllegalArgumentException("Coordinates must be an array");
        }
        List<Point> result = new ArrayList<>();
        for (JsonNode coordinate : coordinates) {
            if (!coordinate.isArray() || coordinate.size() != 2
                    || !coordinate.get(0).isNumber() || !coordinate.get(1).isNumber()) {
                throw new IllegalArgumentException("Coordinates must contain longitude and latitude");
            }
            double lng = coordinate.get(0).asDouble();
            double lat = coordinate.get(1).asDouble();
            if (!Double.isFinite(lng) || !Double.isFinite(lat)
                    || Math.abs(lng) > LONGITUDE_LIMIT || Math.abs(lat) > LATITUDE_LIMIT) {
                throw new IllegalArgumentException("Coordinates are outside geographic bounds");
            }
            result.add(new Point(lng, lat));
        }
        return List.copyOf(result);
    }
}
