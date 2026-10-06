package com.wildx.wildx.util;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class GeoUtilTest {
    private static final String POLYGON = "{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[1,1],[2,1],[2,2],[1,2],[1,1]]]}";

    @Test
    void sectorMapsPointsAndExcludesPolygonHoles() {
        assertThat(GeoUtil.contains(POLYGON, 3, 3)).isTrue();
        assertThat(GeoUtil.contains(POLYGON, 0, 0)).isTrue();
        assertThat(GeoUtil.contains(POLYGON, 5, 3)).isFalse();
        assertThat(GeoUtil.contains(POLYGON, 1.5, 1.5)).isFalse();
        assertThat(GeoUtil.contains(POLYGON, 1, 1)).isFalse();
    }

    @Test
    void sectorRejectsOpenAndEmptyPolygons() {
        assertThatThrownBy(() -> GeoUtil.polygon("{\"type\":\"Polygon\",\"coordinates\":[]}"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> GeoUtil.polygon("{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[4,0],[4,4],[0,4]]]}"))
                .isInstanceOf(IllegalArgumentException.class);
    }
    @Test
    void routeAcceptsLineStringInLongitudeLatitudeOrder() {
        assertThat(GeoUtil.line("{\"type\":\"LineString\",\"coordinates\":[[80,6],[81,7]]}"))
                .containsExactly(new GeoUtil.Point(80, 6), new GeoUtil.Point(81, 7));
    }

    @Test
    void routeRejectsInvalidRoutes() {
        for (String input : new String[]{"null", "{}", "broken",
                "{\"type\":\"Polygon\",\"coordinates\":[[80,6],[81,7]]}",
                "{\"type\":\"LineString\",\"coordinates\":[[80,6]]}",
                "{\"type\":\"LineString\",\"coordinates\":[[181,6],[80,7]]}",
                "{\"type\":\"LineString\",\"coordinates\":[[80,91],[80,7]]}",
                "{\"type\":\"LineString\",\"coordinates\":[[\"80\",6],[80,7]]}"}) {
            assertThatThrownBy(() -> GeoUtil.line(input)).isInstanceOf(IllegalArgumentException.class);
        }
    }
}

