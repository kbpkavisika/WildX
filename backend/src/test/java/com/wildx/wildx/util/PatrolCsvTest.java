package com.wildx.wildx.util;

import com.wildx.wildx.dto.SectorCoverageReportResponse;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class PatrolCsvTest {
    @Test
    void escapesQuotedMultilineNamesAndKeepsZeroVisitValues() {
        String csv = PatrolCsv.coverage(List.of(new SectorCoverageReportResponse(1L, "North, \"A\"\nEast", 2, 1,
                Instant.parse("2026-10-07T03:00:00Z")), new SectorCoverageReportResponse(2L, "Never", 0, 0, null)));
        assertThat(csv).startsWith("sector_id,sector_name,point_count,patrol_count,last_patrolled_at\r\n");
        assertThat(csv).contains("1,\"North, \"\"A\"\"\nEast\",2,1,2026-10-07T03:00:00Z\r\n");
        assertThat(csv).endsWith("2,\"Never\",0,0,\r\n");
    }

    @Test
    void neutralizesSpreadsheetFormulasAndExportsAnEmptyHeader() {
        for (String name : List.of("=SUM(1)", " +1", "-2", "@cmd", "\t=1", "\n=1")) {
            String csv = PatrolCsv.coverage(List.of(new SectorCoverageReportResponse(1L, name, 0, 0, null)));
            assertThat(csv).contains("1,\"'" + name + "\",0,0,");
        }
        assertThat(PatrolCsv.coverage(List.of())).isEqualTo("sector_id,sector_name,point_count,patrol_count,last_patrolled_at\r\n");
    }
}
