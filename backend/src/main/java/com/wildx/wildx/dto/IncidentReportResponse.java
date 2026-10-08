package com.wildx.wildx.dto;

import java.time.LocalDate;
import java.util.List;

public record IncidentReportResponse(LocalDate from, LocalDate to, long total, List<IncidentReportCount> byType,
                                     List<IncidentReportCount> bySector, List<IncidentReportCount> byMonth,
                                     List<IncidentReportPoint> points) {}
