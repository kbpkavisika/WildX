package com.wildx.wildx.dto;

import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportChannel;
import com.wildx.wildx.type.ReportType;
import com.wildx.wildx.type.Severity;

import java.time.Instant;

public record CommunityReportResponse(
        Long id,
        String referenceCode,
        Long parkId,
        Long segmentId,
        String segmentCode,
        String segmentName,
        ReportChannel channel,
        String reporterPhone,
        ReportType type,
        int animalCount,
        String description,
        String photoPath,
        Double lat,
        Double lng,
        String rawText,
        CommunityReportStatus status,
        Long duplicateOfId,
        String duplicateOfRef,
        Severity severity,
        String invalidReason,
        String outcome,
        Instant createdAt,
        Instant closedAt
) {
    public static CommunityReportResponse from(CommunityReport report) {
        return new CommunityReportResponse(
                report.getId(),
                report.getReferenceCode(),
                report.getPark().getId(),
                report.getSegment() != null ? report.getSegment().getId() : null,
                report.getSegment() != null ? report.getSegment().getCode() : null,
                report.getSegment() != null ? report.getSegment().getName() : null,
                report.getChannel(),
                report.getReporterPhone(),
                report.getType(),
                report.getAnimalCount(),
                report.getDescription(),
                report.getPhotoPath(),
                report.getLat(),
                report.getLng(),
                report.getRawText(),
                report.getStatus(),
                report.getDuplicateOf() != null ? report.getDuplicateOf().getId() : null,
                report.getDuplicateOf() != null ? report.getDuplicateOf().getReferenceCode() : null,
                report.getSeverity(),
                report.getInvalidReason(),
                report.getOutcome(),
                report.getCreatedAt(),
                report.getClosedAt()
        );
    }
}
