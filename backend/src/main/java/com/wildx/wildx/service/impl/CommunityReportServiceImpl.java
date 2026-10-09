package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.dto.BoundarySegmentResponse;
import com.wildx.wildx.dto.CommunityReportPhoto;
import com.wildx.wildx.dto.CommunityReportResponse;
import com.wildx.wildx.dto.ConflictTrendReportResponse;
import com.wildx.wildx.dto.HotspotResponse;
import com.wildx.wildx.dto.PublicReportCreateRequest;
import com.wildx.wildx.dto.PublicReportResponse;
import com.wildx.wildx.dto.ReportInvalidateRequest;
import com.wildx.wildx.dto.ReportLocationUpdateRequest;
import com.wildx.wildx.dto.ReportValidateRequest;
import com.wildx.wildx.dto.SmsHelpCardResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.util.SmsParser;
import com.wildx.wildx.model.BoundarySegment;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.CommunityReportRepository;
import com.wildx.wildx.service.BoundarySegmentService;
import com.wildx.wildx.service.CommunityReportService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportChannel;
import com.wildx.wildx.type.ReportType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityReportServiceImpl implements CommunityReportService {
    private static final Set<CommunityReportStatus> CLOSED_STATUSES = Set.of(
            CommunityReportStatus.CLOSED,
            CommunityReportStatus.INVALID,
            CommunityReportStatus.DUPLICATE
    );

    private static final Set<CommunityReportStatus> VALIDATED_CONFLICT_STATUSES = Set.of(
            CommunityReportStatus.VALIDATED,
            CommunityReportStatus.DISPATCHED,
            CommunityReportStatus.CLOSED
    );

    private final CommunityReportRepository reports;
    private final ParkService parks;
    private final BoundarySegmentService segments;
    private final Clock clock;

    @Value("${wildx.upload-dir:./uploads}")
    private String uploadDir = "./uploads";

    @Value("${wildx.sms.short-code:8800}")
    private String shortCode = "8800";

    private final AtomicLong referenceCounter = new AtomicLong(1000);

    @Override
    @Transactional
    public PublicReportResponse submitPublicReport(PublicReportCreateRequest request, MultipartFile photo) {
        log.info("submit public report started parkId={} phone={}", request.parkId(), request.reporterPhone());
        Park park = parks.require(request.parkId());
        BoundarySegment segment = resolveSegment(park.getId(), request.segmentId(), request.landmarkCode(), request.lat(), request.lng());

        CommunityReport report = new CommunityReport();
        report.setPark(park);
        report.setChannel(ReportChannel.WEB);
        report.setType(request.type());
        report.setAnimalCount(request.animalCount() != null ? request.animalCount() : 1);
        report.setDescription(request.description() != null ? request.description().strip() : null);
        report.setReporterPhone(request.reporterPhone().strip());
        report.setReferenceCode(generateReferenceCode());
        report.setRawText(request.description());

        if (segment != null) {
            report.setSegment(segment);
            report.setLat(request.lat() != null ? request.lat() : segment.getCenterLat());
            report.setLng(request.lng() != null ? request.lng() : segment.getCenterLng());
            checkDuplicateAndSetStatus(report, park, segment);
        } else if (request.lat() != null && request.lng() != null) {
            report.setLat(request.lat());
            report.setLng(request.lng());
            report.setStatus(CommunityReportStatus.NEEDS_LOCATION);
        } else {
            report.setStatus(CommunityReportStatus.NEEDS_LOCATION);
        }

        if (photo != null && !photo.isEmpty()) {
            report.setPhotoPath(savePhoto(photo));
        }

        CommunityReport saved = reports.save(report);
        PublicReportResponse response = PublicReportResponse.from(saved);
        log.info("submit public report completed ref={} status={}", response.referenceCode(), response.status());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PublicReportResponse getPublicReportByRef(String referenceCode) {
        log.info("get public report started ref={}", referenceCode);
        String clean = normalizeReferenceCode(referenceCode);
        CommunityReport report = reports.findByReferenceCodeIgnoreCase(clean)
                .or(() -> reports.findByReferenceCode(clean))
                .orElseThrow(() -> new NotFoundException("Report not found"));
        PublicReportResponse response = PublicReportResponse.from(report);
        log.info("get public report completed ref={}", referenceCode);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommunityReportResponse> listReports(Long parkId, CommunityReportStatus status) {
        log.info("list community reports started parkId={} status={}", parkId, status);
        List<CommunityReport> list = (status == null)
                ? reports.findByParkIdOrderByCreatedAtDescIdDesc(parkId)
                : reports.findByParkIdAndStatusOrderByCreatedAtDescIdDesc(parkId, status);
        var response = list.stream().map(CommunityReportResponse::from).toList();
        log.info("list community reports completed parkId={} count={}", parkId, response.size());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public CommunityReportResponse getReport(Long parkId, Long id) {
        log.info("get community report started parkId={} reportId={}", parkId, id);
        CommunityReport report = require(id, parkId);
        CommunityReportResponse response = CommunityReportResponse.from(report);
        log.info("get community report completed parkId={} reportId={}", parkId, id);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public CommunityReport require(Long id, Long parkId) {
        return reports.findByIdAndParkId(id, parkId)
                .orElseThrow(() -> new NotFoundException("Community report not found"));
    }

    @Override
    @Transactional
    public CommunityReport createSmsReport(Long parkId, String fromPhone, ReportType type, String landmarkCode, Integer count, String rawText) {
        log.info("create sms report started parkId={} landmark={}", parkId, landmarkCode);
        Park park = parks.require(parkId);
        BoundarySegment segment = landmarkCode != null && !landmarkCode.isBlank()
                ? segments.findByCode(parkId, landmarkCode).orElse(null)
                : null;

        CommunityReport report = new CommunityReport();
        report.setPark(park);
        report.setChannel(ReportChannel.SMS);
        report.setType(type != null ? type : ReportType.OTHER);
        report.setAnimalCount(count != null && count > 0 ? count : 1);
        report.setReporterPhone(fromPhone);
        report.setReferenceCode(generateReferenceCode());
        report.setRawText(rawText);

        if (segment != null) {
            report.setSegment(segment);
            report.setLat(segment.getCenterLat());
            report.setLng(segment.getCenterLng());
            checkDuplicateAndSetStatus(report, park, segment);
        } else {
            report.setStatus(CommunityReportStatus.NEEDS_LOCATION);
        }

        CommunityReport saved = reports.save(report);
        log.info("create sms report completed ref={} status={}", saved.getReferenceCode(), saved.getStatus());
        return saved;
    }

    @Override
    @Transactional
    public CommunityReportResponse updateLocation(Long parkId, Long id, ReportLocationUpdateRequest request) {
        log.info("update location started parkId={} reportId={}", parkId, id);
        CommunityReport report = require(id, parkId);
        BoundarySegment segment = resolveSegment(parkId, request.segmentId(), request.landmarkCode(), request.lat(), request.lng());
        if (segment == null && (request.lat() == null || request.lng() == null)) {
            throw new IllegalArgumentException("A valid segment, landmark code, or GPS coordinate pair is required");
        }
        if (segment != null) {
            report.setSegment(segment);
            report.setLat(request.lat() != null ? request.lat() : segment.getCenterLat());
            report.setLng(request.lng() != null ? request.lng() : segment.getCenterLng());
            if (report.getStatus() == CommunityReportStatus.NEEDS_LOCATION) {
                Park park = parks.require(parkId);
                checkDuplicateAndSetStatus(report, park, segment);
            }
        } else {
            report.setLat(request.lat());
            report.setLng(request.lng());
            if (report.getStatus() == CommunityReportStatus.NEEDS_LOCATION) {
                report.setStatus(CommunityReportStatus.NEW);
            }
        }
        log.info("update location completed reportId={} status={}", id, report.getStatus());
        return CommunityReportResponse.from(report);
    }

    @Override
    @Transactional
    public CommunityReportResponse validateReport(Long parkId, Long id, ReportValidateRequest request) {
        log.info("validate report started parkId={} reportId={} severity={}", parkId, id, request.severity());
        CommunityReport report = require(id, parkId);
        if (CLOSED_STATUSES.contains(report.getStatus()) || report.getStatus() == CommunityReportStatus.DISPATCHED) {
            throw new IllegalStateException("Cannot validate report with status " + report.getStatus());
        }
        if (report.getStatus() == CommunityReportStatus.NEEDS_LOCATION || report.getSegment() == null) {
            throw new IllegalStateException("Report requires a valid boundary segment before validation");
        }
        report.setStatus(CommunityReportStatus.VALIDATED);
        report.setSeverity(request.severity());
        CommunityReport saved = reports.save(report);
        log.info("validate report completed parkId={} reportId={} severity={}", parkId, id, saved.getSeverity());
        return CommunityReportResponse.from(saved);
    }

    @Override
    @Transactional
    public CommunityReportResponse invalidateReport(Long parkId, Long id, ReportInvalidateRequest request) {
        log.info("invalidate report started parkId={} reportId={} reason={}", parkId, id, request.reason());
        CommunityReport report = require(id, parkId);
        if (report.getStatus() == CommunityReportStatus.CLOSED || report.getStatus() == CommunityReportStatus.DISPATCHED) {
            throw new IllegalStateException("Cannot invalidate report with status " + report.getStatus());
        }
        if (report.getStatus() == CommunityReportStatus.INVALID) {
            throw new IllegalStateException("Report is already invalid");
        }
        report.setStatus(CommunityReportStatus.INVALID);
        report.setInvalidReason(request.reason().strip());
        report.setClosedAt(clock.instant());
        CommunityReport saved = reports.save(report);
        log.info("invalidate report completed parkId={} reportId={}", parkId, id);
        return CommunityReportResponse.from(saved);
    }

    private BoundarySegment resolveSegment(Long parkId, Long segmentId, String landmarkCode, Double lat, Double lng) {
        if (segmentId != null) {
            return segments.require(segmentId, parkId);
        }
        if (landmarkCode != null && !landmarkCode.isBlank()) {
            return segments.findByCode(parkId, landmarkCode).orElse(null);
        }
        if (lat != null && lng != null) {
            return segments.findNearest(parkId, lat, lng).orElse(null);
        }
        return null;
    }

    private void checkDuplicateAndSetStatus(CommunityReport report, Park park, BoundarySegment segment) {
        Instant after = clock.instant().minus(Duration.ofMinutes(park.getDuplicateWindowMin()));
        Optional<CommunityReport> openReport = reports
                .findFirstByParkIdAndSegmentIdAndStatusNotInAndCreatedAtAfterOrderByCreatedAtDesc(
                        park.getId(),
                        segment.getId(),
                        CLOSED_STATUSES,
                        after
                );
        if (openReport.isPresent()) {
            report.setStatus(CommunityReportStatus.DUPLICATE);
            report.setDuplicateOf(openReport.get());
        } else {
            report.setStatus(CommunityReportStatus.NEW);
        }
    }

    private synchronized String generateReferenceCode() {
        long base = reports.findTopByOrderByIdDesc()
                .map(r -> Math.max(extractRefNumber(r.getReferenceCode()), r.getId() + 1000))
                .orElse(1000L);
        long candidate = Math.max(base + 1, referenceCounter.incrementAndGet());
        referenceCounter.set(candidate);
        while (reports.findByReferenceCode("R-" + candidate).isPresent()) {
            candidate = referenceCounter.incrementAndGet();
        }
        return "R-" + candidate;
    }

    private long extractRefNumber(String referenceCode) {
        if (referenceCode == null) {
            return 1000L;
        }
        try {
            String digits = referenceCode.replaceAll("[^0-9]", "");
            return digits.isBlank() ? 1000L : Long.parseLong(digits);
        } catch (Exception ex) {
            return 1000L;
        }
    }

    private String savePhoto(MultipartFile file) {
        try {
            Path dir = Path.of(uploadDir, "reports");
            Files.createDirectories(dir);
            String extension = extractExtension(file.getOriginalFilename());
            String filename = "report-" + UUID.randomUUID() + extension;
            Path destination = dir.resolve(filename);
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
            }
            return "reports/" + filename;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store photo", ex);
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        String ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
        if (ext.equals(".png") || ext.equals(".jpeg") || ext.equals(".jpg") || ext.equals(".webp")) {
            return ext;
        }
        return ".jpg";
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotspotResponse> getHotspots(Long parkId) {
        log.info("get hotspots started parkId={}", parkId);
        Park park = parks.require(parkId);
        int threshold = park.getHotspotThreshold();
        Instant thirtyDaysAgo = clock.instant().minus(Duration.ofDays(30));

        List<BoundarySegmentResponse> segmentList = segments.segments(parkId);
        List<CommunityReport> recentReports = reports
                .findByParkIdAndStatusInAndCreatedAtGreaterThanEqual(parkId, VALIDATED_CONFLICT_STATUSES, thirtyDaysAgo);

        Map<Long, Long> countsBySegment = new HashMap<>();
        for (CommunityReport report : recentReports) {
            if (report.getSegment() != null) {
                countsBySegment.merge(report.getSegment().getId(), 1L, Long::sum);
            }
        }

        List<HotspotResponse> response = segmentList.stream()
                .map(s -> {
                    long count = countsBySegment.getOrDefault(s.id(), 0L);
                    boolean isHotspot = count >= threshold;
                    return new HotspotResponse(
                            s.id(),
                            s.name(),
                            s.code(),
                            s.centerLat(),
                            s.centerLng(),
                            count,
                            threshold,
                            isHotspot
                    );
                })
                .sorted(Comparator.comparing(HotspotResponse::hotspot).reversed()
                        .thenComparing(HotspotResponse::conflictCount, Comparator.reverseOrder())
                        .thenComparing(HotspotResponse::segmentName))
                .toList();

        log.info("get hotspots completed parkId={} count={}", parkId, response.size());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConflictTrendReportResponse> getConflictTrends(Long parkId, LocalDate from, LocalDate to) {
        log.info("get conflict trends started parkId={} from={} to={}", parkId, from, to);
        if (from == null || to == null || from.isAfter(to) || to.equals(LocalDate.MAX)) {
            throw new IllegalArgumentException("Provide a valid inclusive date range");
        }
        parks.require(parkId);
        List<BoundarySegmentResponse> segmentList = segments.segments(parkId);

        Instant start = from.atStartOfDay(PatrolConstants.PARK_ZONE).toInstant();
        Instant until = to.plusDays(1).atStartOfDay(PatrolConstants.PARK_ZONE).toInstant();

        List<CommunityReport> rangeReports = reports
                .findByParkIdAndStatusInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        parkId,
                        VALIDATED_CONFLICT_STATUSES,
                        start,
                        until
                );

        Map<String, Map<Long, Long>> countsByMonthAndSegment = new HashMap<>();
        for (CommunityReport report : rangeReports) {
            if (report.getSegment() != null) {
                YearMonth ym = YearMonth.from(report.getCreatedAt().atZone(PatrolConstants.PARK_ZONE));
                String monthKey = ym.toString();
                countsByMonthAndSegment
                        .computeIfAbsent(monthKey, k -> new HashMap<>())
                        .merge(report.getSegment().getId(), 1L, Long::sum);
            }
        }

        List<YearMonth> months = new ArrayList<>();
        YearMonth current = YearMonth.from(from);
        YearMonth end = YearMonth.from(to);
        while (!current.isAfter(end)) {
            months.add(current);
            current = current.plusMonths(1);
        }

        List<ConflictTrendReportResponse> result = new ArrayList<>();
        for (YearMonth ym : months) {
            String monthKey = ym.toString();
            Map<Long, Long> segmentCounts = countsByMonthAndSegment.getOrDefault(monthKey, Map.of());
            for (BoundarySegmentResponse segment : segmentList) {
                long count = segmentCounts.getOrDefault(segment.id(), 0L);
                result.add(new ConflictTrendReportResponse(
                        monthKey,
                        segment.id(),
                        segment.name(),
                        segment.code(),
                        count
                ));
            }
        }

        result.sort(Comparator.comparing(ConflictTrendReportResponse::month)
                .thenComparing(ConflictTrendReportResponse::segmentName));

        log.info("get conflict trends completed count={}", result.size());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public SmsHelpCardResponse getSmsHelpCard(Long parkId) {
        log.info("get sms help card started parkId={}", parkId);
        Park park = parks.require(parkId);
        List<BoundarySegmentResponse> segmentList = segments.segments(parkId);

        List<SmsHelpCardResponse.KeywordHelp> keywords = List.of(
                new SmsHelpCardResponse.KeywordHelp("SIGHTING", "Elephant sighting", "ELE", "ALI", "YANAI"),
                new SmsHelpCardResponse.KeywordHelp("CROP_DAMAGE", "Crop damage", "CROP", "GOVI", "PAYIR"),
                new SmsHelpCardResponse.KeywordHelp("OTHER", "Other / emergency", "HELP", "UDAW", "UTHAVI")
        );

        List<SmsHelpCardResponse.LandmarkHelp> landmarks = segmentList.stream()
                .map(s -> new SmsHelpCardResponse.LandmarkHelp(
                        s.id(),
                        s.code(),
                        s.name(),
                        s.centerLat(),
                        s.centerLng()
                ))
                .sorted(Comparator.comparing(SmsHelpCardResponse.LandmarkHelp::code))
                .toList();

        SmsHelpCardResponse response = new SmsHelpCardResponse(
                park.getId(),
                park.getName(),
                shortCode,
                "TYPE LANDMARK [COUNT]",
                "ELE KUMB 3",
                SmsParser.HELP_MESSAGE,
                keywords,
                landmarks
        );
        log.info("get sms help card completed parkId={} landmarkCount={}", parkId, landmarks.size());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public CommunityReportPhoto getPhoto(Long parkId, Long id) {
        log.info("get community report photo started parkId={} id={}", parkId, id);
        CommunityReport report = reports.findByIdAndParkId(id, parkId)
                .orElseThrow(() -> new NotFoundException("Report not found"));
        return readPhoto(report.getPhotoPath());
    }

    @Override
    @Transactional(readOnly = true)
    public CommunityReportPhoto getPublicPhoto(String referenceCode) {
        log.info("get public report photo started ref={}", referenceCode);
        String clean = normalizeReferenceCode(referenceCode);
        CommunityReport report = reports.findByReferenceCodeIgnoreCase(clean)
                .or(() -> reports.findByReferenceCode(clean))
                .orElseThrow(() -> new NotFoundException("Report not found"));
        return readPhoto(report.getPhotoPath());
    }

    private String normalizeReferenceCode(String referenceCode) {
        if (referenceCode == null) {
            return "";
        }
        String clean = referenceCode.strip().toUpperCase();
        if (!clean.startsWith("R-") && clean.matches("\\d+")) {
            return "R-" + clean;
        }
        return clean;
    }

    private CommunityReportPhoto readPhoto(String photoPath) {
        if (photoPath == null || photoPath.isBlank()) {
            throw new NotFoundException("Report has no photo");
        }
        Path path = Path.of(uploadDir, photoPath).normalize();
        if (!Files.exists(path)) {
            Path alt1 = Path.of("uploads", photoPath).normalize();
            Path alt2 = Path.of("..", "uploads", photoPath).normalize();
            Path alt3 = Path.of("backend", "uploads", photoPath).normalize();
            Path alt4 = Path.of(photoPath).normalize();
            if (Files.exists(alt1)) {
                path = alt1;
            } else if (Files.exists(alt2)) {
                path = alt2;
            } else if (Files.exists(alt3)) {
                path = alt3;
            } else if (Files.exists(alt4)) {
                path = alt4;
            } else {
                throw new NotFoundException("Photo file not found");
            }
        }
        try {
            byte[] bytes = Files.readAllBytes(path);
            String lower = photoPath.toLowerCase();
            String contentType = "image/jpeg";
            if (lower.endsWith(".png")) {
                contentType = "image/png";
            } else if (lower.endsWith(".webp")) {
                contentType = "image/webp";
            }
            return new CommunityReportPhoto(bytes, contentType);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read photo", ex);
        }
    }
}

