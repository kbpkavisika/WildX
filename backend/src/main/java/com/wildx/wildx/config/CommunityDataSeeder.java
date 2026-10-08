package com.wildx.wildx.config;

import com.wildx.wildx.model.BoundarySegment;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.BoundarySegmentRepository;
import com.wildx.wildx.repository.CommunityReportRepository;
import com.wildx.wildx.repository.ParkRepository;
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
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class CommunityDataSeeder implements CommandLineRunner {

    private final CommunityReportRepository communityReportRepository;
    private final ParkRepository parkRepository;
    private final BoundarySegmentRepository boundarySegmentRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (communityReportRepository.count() > 0) {
            return;
        }

        Optional<Park> yalaOpt = parkRepository.findAll().stream()
                .filter(p -> "YALA".equalsIgnoreCase(p.getCode()))
                .findFirst();
        if (yalaOpt.isEmpty()) {
            return;
        }

        Park yala = yalaOpt.get();
        List<BoundarySegment> segments = boundarySegmentRepository.findByParkIdOrderByNameAscIdAsc(yala.getId());
        BoundarySegment kumbukgaha = segments.stream()
                .filter(s -> "KUMB".equalsIgnoreCase(s.getCode()))
                .findFirst()
                .orElse(null);
        BoundarySegment palatupana = segments.stream()
                .filter(s -> "PAL".equalsIgnoreCase(s.getCode()))
                .findFirst()
                .orElse(null);
        BoundarySegment katagamuwa = segments.stream()
                .filter(s -> "KAT".equalsIgnoreCase(s.getCode()))
                .findFirst()
                .orElse(null);

        CommunityReport r1 = new CommunityReport();
        r1.setPark(yala);
        r1.setReferenceCode("R-1001");
        r1.setChannel(ReportChannel.WEB);
        r1.setType(ReportType.SIGHTING);
        r1.setAnimalCount(3);
        r1.setDescription("Herd of 3 Asian elephants spotted feeding near Kumbukgaha boundary fence.");
        r1.setReporterPhone("+94771234567");
        r1.setStatus(CommunityReportStatus.NEW);
        if (kumbukgaha != null) {
            r1.setSegment(kumbukgaha);
            r1.setLat(kumbukgaha.getCenterLat());
            r1.setLng(kumbukgaha.getCenterLng());
        }

        CommunityReport r2 = new CommunityReport();
        r2.setPark(yala);
        r2.setReferenceCode("R-1002");
        r2.setChannel(ReportChannel.SMS);
        r2.setType(ReportType.CROP_DAMAGE);
        r2.setAnimalCount(1);
        r2.setDescription("Single bull elephant damaged paddy field near village border.");
        r2.setReporterPhone("+94719876543");
        r2.setStatus(CommunityReportStatus.NEEDS_LOCATION);

        CommunityReport r3 = new CommunityReport();
        r3.setPark(yala);
        r3.setReferenceCode("R-1003");
        r3.setChannel(ReportChannel.WEB);
        r3.setType(ReportType.SIGHTING);
        r3.setAnimalCount(2);
        r3.setDescription("Elephants crossing towards Palatupana access corridor.");
        r3.setReporterPhone("+94751122334");
        r3.setStatus(CommunityReportStatus.VALIDATED);
        r3.setSeverity(Severity.HIGH);
        if (palatupana != null) {
            r3.setSegment(palatupana);
            r3.setLat(palatupana.getCenterLat());
            r3.setLng(palatupana.getCenterLng());
        }

        CommunityReport r4 = new CommunityReport();
        r4.setPark(yala);
        r4.setReferenceCode("R-1004");
        r4.setChannel(ReportChannel.SMS);
        r4.setType(ReportType.OTHER);
        r4.setAnimalCount(2);
        r4.setDescription("Two elephants close to Katagamuwa school access road.");
        r4.setReporterPhone("+94778889900");
        r4.setStatus(CommunityReportStatus.CLOSED);
        r4.setSeverity(Severity.HIGH);
        r4.setOutcome("Ranger unit responded on-site; elephants safely guided back into sanctuary buffer. Fence verified intact.");
        r4.setClosedAt(Instant.now());
        if (katagamuwa != null) {
            r4.setSegment(katagamuwa);
            r4.setLat(katagamuwa.getCenterLat());
            r4.setLng(katagamuwa.getCenterLng());
        }

        communityReportRepository.saveAll(List.of(r1, r2, r3, r4));
        log.info("Seeded initial community reports for park {}", yala.getCode());
    }
}
