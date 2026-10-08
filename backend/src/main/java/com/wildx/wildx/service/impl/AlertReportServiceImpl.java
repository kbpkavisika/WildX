package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.dto.AlertReportResponse;
import com.wildx.wildx.dto.AlertReportRow;
import com.wildx.wildx.model.Alert;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.service.AlertReportService;
import com.wildx.wildx.type.AlertType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertReportServiceImpl implements AlertReportService {
    private static final double MILLIS_PER_MINUTE = 60_000.0;

    private final AlertRepository alerts;

    private record Group(AlertType type, Long zoneId) {}

    @Override
    @Transactional(readOnly = true)
    public AlertReportResponse report(Long parkId, LocalDate from, LocalDate to) {
        log.info("alert report started parkId={}", parkId);
        if (from == null || to == null || from.isAfter(to) || to.equals(LocalDate.MAX)) {
            throw new IllegalArgumentException("Provide a valid inclusive date range");
        }
        Instant start = from.atStartOfDay(PatrolConstants.PARK_ZONE).toInstant();
        Instant until = to.plusDays(1).atStartOfDay(PatrolConstants.PARK_ZONE).toInstant();
        List<Alert> raised = alerts.findByParkIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(parkId, start, until);
        List<AlertReportRow> rows = raised.stream()
                .collect(Collectors.groupingBy(alert -> new Group(alert.getType(),
                        alert.getZone() == null ? null : alert.getZone().getId()), LinkedHashMap::new, Collectors.toList()))
                .values().stream().map(this::row)
                .sorted(Comparator.comparingLong(AlertReportRow::count).reversed()
                        .thenComparing(AlertReportRow::type)
                        .thenComparing(AlertReportRow::zoneName, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        var report = new AlertReportResponse(from, to, raised.size(), median(raised, Alert::getAcknowledgedAt),
                median(raised, Alert::getResolvedAt), rows);
        log.info("alert report completed parkId={} total={}", parkId, report.total());
        return report;
    }

    private AlertReportRow row(List<Alert> group) {
        Alert first = group.getFirst();
        return new AlertReportRow(first.getType(), first.getZone() == null ? null : first.getZone().getId(),
                first.getZone() == null ? null : first.getZone().getName(), group.size(),
                median(group, Alert::getAcknowledgedAt), median(group, Alert::getResolvedAt));
    }

    private Double median(List<Alert> group, Function<Alert, Instant> end) {
        List<Long> millis = group.stream().filter(alert -> end.apply(alert) != null)
                .map(alert -> Duration.between(alert.getCreatedAt(), end.apply(alert)).toMillis())
                .sorted().toList();
        if (millis.isEmpty()) {
            return null;
        }
        int middle = millis.size() / 2;
        double value = millis.size() % 2 == 1 ? millis.get(middle) : (millis.get(middle - 1) + millis.get(middle)) / 2.0;
        return Math.round(value / MILLIS_PER_MINUTE * 10) / 10.0;
    }
}
