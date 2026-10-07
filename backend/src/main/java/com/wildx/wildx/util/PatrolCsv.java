package com.wildx.wildx.util;

import com.wildx.wildx.dto.SectorCoverageReportResponse;
import java.util.List;

public final class PatrolCsv {
    private PatrolCsv() {}

    public static String coverage(List<SectorCoverageReportResponse> rows) {
        StringBuilder csv = new StringBuilder("sector_id,sector_name,point_count,patrol_count,last_patrolled_at\r\n");
        for (var row : rows) {
            csv.append(row.sectorId()).append(',').append(cell(row.sectorName())).append(',')
                    .append(row.pointCount()).append(',').append(row.patrolCount()).append(',')
                    .append(row.lastPatrolledAt() == null ? "" : row.lastPatrolledAt()).append("\r\n");
        }
        return csv.toString();
    }

    private static String cell(String value) {
        String stripped = value.stripLeading();
        if (!stripped.isEmpty() && "=+-@".indexOf(stripped.charAt(0)) >= 0) {
            value = "'" + value;
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
