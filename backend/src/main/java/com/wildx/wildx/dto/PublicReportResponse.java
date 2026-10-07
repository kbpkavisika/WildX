package com.wildx.wildx.dto;

import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportType;

import java.time.Instant;

public record PublicReportResponse(
        String referenceCode,
        CommunityReportStatus status,
        ReportType type,
        int animalCount,
        String description,
        String landmarkCode,
        String segmentName,
        String photoPath,
        String outcome,
        Instant createdAt,
        Instant closedAt
) {
    public static PublicReportResponse from(CommunityReport report) {
        return new PublicReportResponse(
                report.getReferenceCode(),
                report.getStatus(),
                report.getType(),
                report.getAnimalCount(),
                report.getDescription(),
                report.getSegment() != null ? report.getSegment().getCode() : null,
                report.getSegment() != null ? report.getSegment().getName() : null,
                report.getPhotoPath(),
                report.getOutcome() != null ? report.getOutcome() : report.getInvalidReason(),
                report.getCreatedAt(),
                report.getClosedAt()
        );
    }
}
