package com.wildx.wildx.util;

import com.wildx.wildx.dto.IncidentReportPoint;
import com.wildx.wildx.dto.IncidentReportResponse;
import com.wildx.wildx.type.IncidentStatus;
import com.wildx.wildx.type.Severity;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class IncidentCsvTest {
    @Test
    void writesOneEscapedRowPerIncident() {
        var report = new IncidentReportResponse(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 7), 2, List.of(),
                List.of(), List.of(), List.of(
                new IncidentReportPoint(1L, Instant.parse("2026-10-03T04:00:00Z"), "=Snare \"wire\"", null,
                        Severity.HIGH, IncidentStatus.NEW, 6.5, 81.5),
                new IncidentReportPoint(2L, Instant.parse("2026-10-04T04:00:00Z"), "Carcass", "Sector 3",
                        Severity.LOW, IncidentStatus.DISMISSED, 6.6, 81.6)));

        assertThat(IncidentCsv.report(report)).isEqualTo("id,occurred_at,type,sector,severity,status,lat,lng\r\n"
                + "1,2026-10-03T04:00:00Z,\"'=Snare \"\"wire\"\"\",,HIGH,NEW,6.5,81.5\r\n"
                + "2,2026-10-04T04:00:00Z,\"Carcass\",\"Sector 3\",LOW,DISMISSED,6.6,81.6\r\n");
    }
}
