package com.wildx.wildx.dto;

import com.wildx.wildx.type.AlertType;

public record AlertReportRow(AlertType type, Long zoneId, String zoneName, long count,
                             Double medianAcknowledgeMinutes, Double medianResolveMinutes) {}
