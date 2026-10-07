package com.wildx.wildx.util;

import com.wildx.wildx.dto.ConflictTrendReportResponse;

import java.util.List;

public final class ConflictCsv {
    private ConflictCsv() {}

    public static String conflicts(List<ConflictTrendReportResponse> rows) {
        StringBuilder csv = new StringBuilder("month,segment_id,segment_code,segment_name,conflict_count\r\n");
        for (var row : rows) {
            csv.append(row.month() == null ? "" : row.month()).append(',')
                    .append(row.segmentId() == null ? "" : row.segmentId()).append(',')
                    .append(cell(row.segmentCode())).append(',')
                    .append(cell(row.segmentName())).append(',')
                    .append(row.conflictCount()).append("\r\n");
        }
        return csv.toString();
    }

    private static String cell(String value) {
        if (value == null) {
            return "";
        }
        String stripped = value.stripLeading();
        if (!stripped.isEmpty() && "=+-@".indexOf(stripped.charAt(0)) >= 0) {
            value = "'" + value;
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
