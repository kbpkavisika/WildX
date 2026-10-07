package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.CommunityReportResponse;
import com.wildx.wildx.dto.PublicReportCreateRequest;
import com.wildx.wildx.dto.PublicReportResponse;
import com.wildx.wildx.dto.ReportLocationUpdateRequest;
import com.wildx.wildx.exception.NotFoundException;
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
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
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

    private final CommunityReportRepository reports;
    private final ParkService parks;
    private final BoundarySegmentService segments;
    private final Clock clock;

    @Value("${wildx.upload-dir:./uploads}")
    private String uploadDir = "./uploads";

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
        CommunityReport report = reports.findByReferenceCode(referenceCode.strip())
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
        Optional<CommunityReport> top = reports.findTopByOrderByIdDesc();
        long next = top.map(r -> Math.max(r.getId() + 1000, referenceCounter.incrementAndGet())).orElseGet(referenceCounter::incrementAndGet);
        return "R-" + next;
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
}
