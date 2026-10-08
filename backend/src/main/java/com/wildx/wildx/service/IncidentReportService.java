package com.wildx.wildx.service;

import com.wildx.wildx.dto.IncidentReportResponse;
import java.time.LocalDate;

public interface IncidentReportService {
    IncidentReportResponse report(Long parkId, LocalDate from, LocalDate to);
}
