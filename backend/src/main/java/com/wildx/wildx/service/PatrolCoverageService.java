package com.wildx.wildx.service;

import com.wildx.wildx.dto.SectorCoverageResponse;
import java.util.List;
import java.time.LocalDate;
import com.wildx.wildx.dto.SectorCoverageReportResponse;
import com.wildx.wildx.dto.DailyCount;

public interface PatrolCoverageService {
    List<SectorCoverageResponse> coverage(Long parkId);
    List<SectorCoverageReportResponse> report(Long parkId, LocalDate from, LocalDate to);
    List<DailyCount> daily(Long parkId, LocalDate from, LocalDate to);
}
