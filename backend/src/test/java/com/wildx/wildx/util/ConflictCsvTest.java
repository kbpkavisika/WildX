package com.wildx.wildx.util;

import com.wildx.wildx.dto.ConflictTrendReportResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ConflictCsvTest {

    @Test
    void escapesQuotedMultilineNamesAndExportsCsvRows() {
        String csv = ConflictCsv.conflicts(List.of(
                new ConflictTrendReportResponse("2026-08", 10L, "Kumbukgaha, \"East\"\nZone", "KUMB", 12L),
                new ConflictTrendReportResponse("2026-09", 20L, "Plain Segment", "PLAIN", 4L),
                new ConflictTrendReportResponse("2026-09", null, null, null, 1L)
        ));

        assertThat(csv).startsWith("month,segment_id,segment_code,segment_name,conflict_count\r\n");
        assertThat(csv).contains("2026-08,10,\"KUMB\",\"Kumbukgaha, \"\"East\"\"\nZone\",12\r\n");
        assertThat(csv).contains("2026-09,20,\"PLAIN\",\"Plain Segment\",4\r\n");
        assertThat(csv).endsWith("2026-09,,,,1\r\n");
    }

    @Test
    void neutralizesSpreadsheetFormulasAndExportsEmptyHeader() {
        for (String malicious : List.of("=SUM(1)", " +1", "-2", "@cmd", "\t=1", "\n=1")) {
            String csv = ConflictCsv.conflicts(List.of(
                    new ConflictTrendReportResponse("2026-10", 1L, malicious, malicious, 3L)
            ));
            assertThat(csv).contains("2026-10,1,\"" + "'" + malicious + "\",\"" + "'" + malicious + "\",3\r\n");
        }

        assertThat(ConflictCsv.conflicts(List.of()))
                .isEqualTo("month,segment_id,segment_code,segment_name,conflict_count\r\n");
    }
}
