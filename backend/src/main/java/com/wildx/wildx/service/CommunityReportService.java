package com.wildx.wildx.service;

import com.wildx.wildx.dto.CommunityReportResponse;
import com.wildx.wildx.dto.PublicReportCreateRequest;
import com.wildx.wildx.dto.PublicReportResponse;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CommunityReportService {
    PublicReportResponse submitPublicReport(PublicReportCreateRequest request, MultipartFile photo);

    PublicReportResponse getPublicReportByRef(String referenceCode);

    List<CommunityReportResponse> listReports(Long parkId, CommunityReportStatus status);

    CommunityReportResponse getReport(Long parkId, Long id);

    CommunityReport require(Long id, Long parkId);

    CommunityReport createSmsReport(Long parkId, String fromPhone, ReportType type, String landmarkCode, Integer count, String rawText);
}
