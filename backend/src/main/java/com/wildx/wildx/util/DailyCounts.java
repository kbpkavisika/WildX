package com.wildx.wildx.util;

import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.dto.DailyCount;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public final class DailyCounts {
    private DailyCounts() {}

    public static List<DailyCount> of(Stream<Instant> moments, LocalDate from, LocalDate to) {
        Map<LocalDate, Long> counts = moments.collect(Collectors.groupingBy(
                moment -> moment.atZone(PatrolConstants.PARK_ZONE).toLocalDate(), Collectors.counting()));
        List<DailyCount> days = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            days.add(new DailyCount(day, counts.getOrDefault(day, 0L)));
        }
        return days;
    }
}
