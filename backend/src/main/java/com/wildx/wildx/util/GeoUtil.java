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

    public static List<List<Point>> polygon(String geoJson) {
        JsonNode coordinates = geometry(geoJson, "Polygon").get("coordinates");
        if (coordinates == null || !coordinates.isArray() || coordinates.isEmpty()) {
            throw new IllegalArgumentException("A polygon needs an exterior ring");
        }
        List<List<Point>> rings = new ArrayList<>();
        for (JsonNode ring : coordinates) {
            List<Point> points = points(ring);
            if (points.size() < 4 || !points.getFirst().equals(points.getLast())
                    || points.stream().distinct().count() < 3) {
                throw new IllegalArgumentException("Polygon rings need three vertices and must be closed");
            }
            rings.add(points);
        }
        return List.copyOf(rings);
    }

    public static boolean contains(String geoJson, double lat, double lng) {
        List<List<Point>> rings = polygon(geoJson);
        if (!inside(rings.getFirst(), lat, lng)) {
            return false;
        }
        return rings.stream().skip(1).noneMatch(ring -> inside(ring, lat, lng));
    }

    private static boolean inside(List<Point> ring, double lat, double lng) {
        boolean inside = false;
        for (int i = 1; i < ring.size(); i++) {
            Point a = ring.get(i - 1);
            Point b = ring.get(i);
            double cross = (lng - a.lng()) * (b.lat() - a.lat())
                    - (lat - a.lat()) * (b.lng() - a.lng());
            if (Math.abs(cross) < 1e-10 && lng >= Math.min(a.lng(), b.lng())
                    && lng <= Math.max(a.lng(), b.lng()) && lat >= Math.min(a.lat(), b.lat())
                    && lat <= Math.max(a.lat(), b.lat())) {
                return true;
            }
            if ((a.lat() > lat) != (b.lat() > lat)
                    && lng < (b.lng() - a.lng()) * (lat - a.lat()) / (b.lat() - a.lat()) + a.lng()) {
                inside = !inside;
            }
        }
        return inside;
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
