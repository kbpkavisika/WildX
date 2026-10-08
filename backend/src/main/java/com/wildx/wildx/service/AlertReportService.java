package com.wildx.wildx.service;

import com.wildx.wildx.dto.AlertReportResponse;
import java.time.LocalDate;

public interface AlertReportService {
    AlertReportResponse report(Long parkId, LocalDate from, LocalDate to);
}
