package com.wildx.wildx.config;

import com.wildx.wildx.model.BoundarySegment;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.BoundarySegmentRepository;
import com.wildx.wildx.repository.CommunityReportRepository;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.repository.SeedHistoryRepository;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportChannel;
import com.wildx.wildx.type.ReportType;
import com.wildx.wildx.type.Severity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@Order(3)
@RequiredArgsConstructor
public class CommunityDataSeeder implements CommandLineRunner {
    private final CommunityReportRepository communityReportRepository;
    private final ParkRepository parkRepository;
    private final BoundarySegmentRepository boundarySegmentRepository;
    private final SeedHistoryRepository history;
    private final Clock clock;

    @Override
    @Transactional
    public void run(String... args) {
        if (communityReportRepository.count() > 0) {
            return;
        }
        int reference = 1001;
        Instant now = clock.instant();
        for (Park park : parkRepository.findAll()) {
            List<BoundarySegment> segments = boundarySegmentRepository.findByParkIdOrderByNameAscIdAsc(park.getId());
            if (segments.isEmpty()) {
                continue;
            }
            BoundarySegment farmland = segments.stream()
                    .filter(segment -> List.of("KUMB", "SEVA").contains(segment.getCode()))
                    .findFirst().orElse(segments.getFirst());
            List<CommunityReport> reports = new ArrayList<>();
            for (CommunityReportStatus status : CommunityReportStatus.values()) {
                BoundarySegment segment = status == CommunityReportStatus.DUPLICATE ? farmland
                        : segments.get(status.ordinal() % segments.size());
                Instant reportedAt = status == CommunityReportStatus.CLOSED ? now.minus(Duration.ofDays(2))
                        : now.minus(Duration.ofMinutes(status == CommunityReportStatus.DUPLICATE ? 15 : 20L + status.ordinal() * 10L));
                CommunityReport report = report(park, segment, reference++, status, reportedAt);
                if (status == CommunityReportStatus.NEW) {
                    report.setSegment(farmland);
                    report.setLat(farmland.getCenterLat());
                    report.setLng(farmland.getCenterLng());
                }
                if (status == CommunityReportStatus.DUPLICATE) {
                    report.setDuplicateOf(reports.getFirst());
                }
                reports.add(save(report, reportedAt));
            }
            for (int i = 0; i < 10; i++) {
                Instant reportedAt = now.minus(Duration.ofDays(i < 6 ? 1L + i * 4L : 21L + (i - 5L) * 14L));
                CommunityReport report = report(park, farmland, reference++,
                        i < 2 ? CommunityReportStatus.VALIDATED : CommunityReportStatus.CLOSED, reportedAt);
                report.setType(ReportType.CROP_DAMAGE);
                report.setAnimalCount(i % 3 + 1);
                report.setDescription("Farmer " + (i + 1) + " reported elephant damage to "
                        + List.of("paddy", "banana", "maize").get(i % 3) + " cultivation near " + farmland.getName() + ".");
                if (report.getChannel() == ReportChannel.SMS) {
                    report.setRawText("CROP " + farmland.getCode() + " " + report.getAnimalCount());
                }
                reports.add(save(report, reportedAt));
            }
            log.info("Seeded {} community reports for park {}", reports.size(), park.getCode());
        }
    }

    private CommunityReport report(Park park, BoundarySegment segment, int reference, CommunityReportStatus status, Instant reportedAt) {
        CommunityReport report = new CommunityReport();
        report.setPark(park);
        report.setReferenceCode("R-" + reference);
        report.setChannel(reference % 2 == 0 ? ReportChannel.SMS : ReportChannel.WEB);
        report.setType(status == CommunityReportStatus.NEEDS_LOCATION ? ReportType.CROP_DAMAGE : ReportType.SIGHTING);
        report.setAnimalCount(3);
        report.setReporterPhone("+9477000" + reference);
        report.setStatus(status);
        report.setSegment(segment);
        report.setLat(segment.getCenterLat());
        report.setLng(segment.getCenterLng());
        report.setDescription(description(status, segment.getName()));
        if (report.getChannel() == ReportChannel.SMS) {
            report.setRawText((report.getType() == ReportType.CROP_DAMAGE ? "CROP " : "ELE ") + segment.getCode() + " 3");
        }
        switch (status) {
            case NEEDS_LOCATION -> {
                report.setSegment(null);
                report.setLat(null);
                report.setLng(null);
                report.setRawText("CROP UNKNOWN 3");
            }
            case VALIDATED -> report.setSeverity(Severity.HIGH);
            case DISPATCHED -> {
                report.setType(ReportType.OTHER);
                report.setSeverity(Severity.CRITICAL);
                if (report.getChannel() == ReportChannel.SMS) {
                    report.setRawText("OTHER " + segment.getCode() + " 3");
                }
            }
            case CLOSED -> {
                report.setSeverity(Severity.MEDIUM);
                report.setOutcome("Rangers guided the herd back to the park; villagers confirmed the access road is clear.");
                report.setClosedAt(reportedAt.plus(Duration.ofMinutes(20)));
            }
            case INVALID -> report.setInvalidReason("Caller confirmed this was an old forwarded sighting, not a current conflict.");
            default -> { }
        }
        return report;
    }

    private CommunityReport save(CommunityReport report, Instant reportedAt) {
        communityReportRepository.save(report);
        history.backdate(CommunityReport.class, report.getId(), reportedAt,
                report.getClosedAt() == null ? reportedAt : report.getClosedAt());
        return report;
    }

    private String description(CommunityReportStatus status, String segment) {
        return switch (status) {
            case NEW -> "Three Asian elephants feeding beside the boundary fence at " + segment + ".";
            case NEEDS_LOCATION -> "Elephant damage to a paddy field; caller has not provided a usable landmark.";
            case DUPLICATE -> "A second villager reported the same herd beside the boundary fence.";
            case VALIDATED -> "Liaison officer verified elephants approaching cultivated land at " + segment + ".";
            case DISPATCHED -> "Elephants are blocking the school access road at " + segment + "; ranger response requested.";
            case CLOSED -> "Elephant herd diverted from the village access road at " + segment + ".";
            case INVALID -> "Forwarded elephant sighting claimed to be near " + segment + ".";
        };
    }
}
