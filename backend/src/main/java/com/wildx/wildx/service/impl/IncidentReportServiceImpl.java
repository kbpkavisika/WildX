package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.dto.IncidentReportCount;
import com.wildx.wildx.dto.IncidentReportPoint;
import com.wildx.wildx.dto.IncidentReportResponse;
import com.wildx.wildx.model.Incident;
import com.wildx.wildx.repository.IncidentRepository;
import com.wildx.wildx.service.IncidentReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IncidentReportServiceImpl implements IncidentReportService {
    private final IncidentRepository incidents;

    @Override
    @Transactional(readOnly = true)
    public IncidentReportResponse report(Long parkId, LocalDate from, LocalDate to) {
        log.info("incident report started parkId={}", parkId);
        if (from == null || to == null || from.isAfter(to) || to.equals(LocalDate.MAX)) {
            throw new IllegalArgumentException("Provide a valid inclusive date range");
        }
        Instant start = from.atStartOfDay(PatrolConstants.PARK_ZONE).toInstant();
        Instant until = to.plusDays(1).atStartOfDay(PatrolConstants.PARK_ZONE).toInstant();
        List<Incident> found = incidents
                .findByParkIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtAscIdAsc(parkId, start, until);
        var report = new IncidentReportResponse(from, to, found.size(),
                counts(found, incident -> incident.getType().getId(), incident -> incident.getType().getName()),
                counts(found, incident -> incident.getSector() == null ? null : incident.getSector().getId(),
                        incident -> incident.getSector() == null ? null : incident.getSector().getName()),
                byMonth(found, YearMonth.from(from), YearMonth.from(to)),
                found.stream().map(IncidentReportPoint::from).toList());
        log.info("incident report completed parkId={} total={}", parkId, report.total());
        return report;
    }

    private List<IncidentReportCount> counts(List<Incident> found, Function<Incident, Long> id,
                                             Function<Incident, String> name) {
        Map<Long, List<Incident>> groups = found.stream()
                .collect(Collectors.groupingBy(incident -> id.apply(incident) == null ? -1L : id.apply(incident),
                        LinkedHashMap::new, Collectors.toList()));
        return groups.values().stream()
                .map(group -> new IncidentReportCount(id.apply(group.getFirst()), name.apply(group.getFirst()), group.size()))
                .sorted(Comparator.comparingLong(IncidentReportCount::count).reversed()
                        .thenComparing(IncidentReportCount::name, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private List<IncidentReportCount> byMonth(List<Incident> found, YearMonth first, YearMonth last) {
        Map<YearMonth, Long> counts = found.stream().collect(Collectors.groupingBy(
                incident -> YearMonth.from(incident.getOccurredAt().atZone(PatrolConstants.PARK_ZONE)), Collectors.counting()));
        List<IncidentReportCount> months = new ArrayList<>();
        for (YearMonth month = first; !month.isAfter(last); month = month.plusMonths(1)) {
            months.add(new IncidentReportCount(null, month.toString(), counts.getOrDefault(month, 0L)));
        }
        return months;
    }
}
