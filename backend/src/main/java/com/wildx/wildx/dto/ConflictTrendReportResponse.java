package com.wildx.wildx.dto;

public record ConflictTrendReportResponse(
        String month,
        Long segmentId,
        String segmentName,
        String segmentCode,
        long conflictCount
) {}
