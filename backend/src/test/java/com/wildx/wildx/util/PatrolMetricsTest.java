package com.wildx.wildx.util;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class PatrolMetricsTest {
    @Test
    void historyComputesDistanceInMetres() {
        assertThat(PatrolMetrics.distance(List.of())).isZero();
        assertThat(PatrolMetrics.distance(List.of(new GeoUtil.Point(0, 0)))).isZero();
        assertThat(PatrolMetrics.distance(List.of(new GeoUtil.Point(0, 0), new GeoUtil.Point(1, 0))))
                .isCloseTo(111195, within(1.0));
        assertThat(PatrolMetrics.distance(List.of(new GeoUtil.Point(0, 0), new GeoUtil.Point(0, 1), new GeoUtil.Point(0, 2))))
                .isCloseTo(222390, within(1.0));
    }

    @Test
    void historyComputesDurationOnlyForValidTimes() {
        Instant start = Instant.parse("2026-10-06T09:00:00Z");
        assertThat(PatrolMetrics.duration(start, start.plusSeconds(3600))).isEqualTo(3600);
        assertThat(PatrolMetrics.duration(null, start)).isZero();
        assertThat(PatrolMetrics.duration(start, null)).isZero();
        assertThatThrownBy(() -> PatrolMetrics.duration(start, start.minusSeconds(1)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

