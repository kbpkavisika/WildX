package com.wildx.wildx.util;

import com.wildx.wildx.dto.AlertReportResponse;

public final class AlertCsv {
    private AlertCsv() {}

    public static String report(AlertReportResponse report) {
        StringBuilder csv = new StringBuilder("type,zone,count,median_acknowledge_minutes,median_resolve_minutes\r\n");
        csv.append("ALL,,").append(report.total()).append(',').append(number(report.medianAcknowledgeMinutes()))
                .append(',').append(number(report.medianResolveMinutes())).append("\r\n");
        for (var row : report.rows()) {
            csv.append(row.type()).append(',').append(row.zoneName() == null ? "" : cell(row.zoneName())).append(',')
                    .append(row.count()).append(',').append(number(row.medianAcknowledgeMinutes())).append(',')
                    .append(number(row.medianResolveMinutes())).append("\r\n");
        }
        return csv.toString();
    }

    private static String number(Double value) {
        return value == null ? "" : value.toString();
    }

    private static String cell(String value) {
        String stripped = value.stripLeading();
        if (!stripped.isEmpty() && "=+-@".indexOf(stripped.charAt(0)) >= 0) {
            value = "'" + value;
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
