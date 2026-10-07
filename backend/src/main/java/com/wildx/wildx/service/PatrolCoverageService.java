package com.wildx.wildx.service;

import com.wildx.wildx.dto.SectorCoverageResponse;
import java.util.List;
import java.time.LocalDate;
import com.wildx.wildx.dto.SectorCoverageReportResponse;

public interface PatrolCoverageService {
    List<SectorCoverageResponse> coverage(Long parkId);
    List<SectorCoverageReportResponse> report(Long parkId, LocalDate from, LocalDate to);
}
