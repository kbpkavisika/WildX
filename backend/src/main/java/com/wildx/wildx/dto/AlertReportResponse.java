package com.wildx.wildx.dto;

import java.time.LocalDate;
import java.util.List;

public record AlertReportResponse(LocalDate from, LocalDate to, long total, Double medianAcknowledgeMinutes,
                                  Double medianResolveMinutes, List<AlertReportRow> rows) {}
