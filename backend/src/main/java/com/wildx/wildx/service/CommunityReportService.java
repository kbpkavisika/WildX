package com.wildx.wildx.service;

import com.wildx.wildx.dto.CommunityReportResponse;
import com.wildx.wildx.dto.ConflictTrendReportResponse;
import com.wildx.wildx.dto.HotspotResponse;
import com.wildx.wildx.dto.PublicReportCreateRequest;
import com.wildx.wildx.dto.PublicReportResponse;
import com.wildx.wildx.dto.ReportInvalidateRequest;
import com.wildx.wildx.dto.ReportLocationUpdateRequest;
import com.wildx.wildx.dto.ReportValidateRequest;
import com.wildx.wildx.dto.SmsHelpCardResponse;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportType;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

public interface CommunityReportService {
    PublicReportResponse submitPublicReport(PublicReportCreateRequest request, MultipartFile photo);

    PublicReportResponse getPublicReportByRef(String referenceCode);

    List<CommunityReportResponse> listReports(Long parkId, CommunityReportStatus status);

    CommunityReportResponse getReport(Long parkId, Long id);

    CommunityReport require(Long id, Long parkId);

    CommunityReport createSmsReport(Long parkId, String fromPhone, ReportType type, String landmarkCode, Integer count, String rawText);

    CommunityReportResponse updateLocation(Long parkId, Long id, ReportLocationUpdateRequest request);

    CommunityReportResponse validateReport(Long parkId, Long id, ReportValidateRequest request);

    CommunityReportResponse invalidateReport(Long parkId, Long id, ReportInvalidateRequest request);

    List<HotspotResponse> getHotspots(Long parkId);

    List<ConflictTrendReportResponse> getConflictTrends(Long parkId, LocalDate from, LocalDate to);

    SmsHelpCardResponse getSmsHelpCard(Long parkId);
}
