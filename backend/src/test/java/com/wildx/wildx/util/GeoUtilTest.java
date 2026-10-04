package com.wildx.wildx.util;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class GeoUtilTest {
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

