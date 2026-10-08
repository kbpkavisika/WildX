package com.wildx.wildx.util;

import com.wildx.wildx.dto.IncidentReportResponse;

public final class IncidentCsv {
    private IncidentCsv() {}

    public static String report(IncidentReportResponse report) {
        StringBuilder csv = new StringBuilder("id,occurred_at,type,sector,severity,status,lat,lng\r\n");
        for (var point : report.points()) {
            csv.append(point.id()).append(',').append(point.occurredAt()).append(',')
                    .append(PatrolCsv.cell(point.typeName())).append(',')
                    .append(point.sectorName() == null ? "" : PatrolCsv.cell(point.sectorName())).append(',')
                    .append(point.severity()).append(',').append(point.status()).append(',')
                    .append(point.lat()).append(',').append(point.lng()).append("\r\n");
        }
        return csv.toString();
    }
}
