package com.wildx.wildx.util;

import com.wildx.wildx.dto.AlertReportResponse;
import com.wildx.wildx.dto.AlertReportRow;
import com.wildx.wildx.type.AlertType;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class AlertCsvTest {
    private static final LocalDate DAY = LocalDate.of(2026, 10, 7);

    @Test
    void writesAllRowThenOneRowPerTypeAndZone() {
        var report = new AlertReportResponse(DAY, DAY, 3, 3.0, 30.5, List.of(
                new AlertReportRow(AlertType.ZONE_BREACH, 10L, "Kumbukgaha farmland", 2, 4.0, 35.0),
                new AlertReportRow(AlertType.MORTALITY, null, null, 1, null, null)));
        assertThat(AlertCsv.report(report)).isEqualTo(
                "type,zone,count,median_acknowledge_minutes,median_resolve_minutes\r\n"
                        + "ALL,,3,3.0,30.5\r\n"
                        + "ZONE_BREACH,\"Kumbukgaha farmland\",2,4.0,35.0\r\n"
                        + "MORTALITY,,1,,\r\n");
    }

    @Test
    void escapesQuotesAndNeutralisesSpreadsheetFormulas() {
        var report = new AlertReportResponse(DAY, DAY, 2, null, null, List.of(
                new AlertReportRow(AlertType.ZONE_BREACH, 1L, "=HYPERLINK(\"x\")", 1, null, null),
                new AlertReportRow(AlertType.ZONE_BREACH, 2L, " @Road \"A\"", 1, null, null)));
        assertThat(AlertCsv.report(report)).contains(
                "ZONE_BREACH,\"'=HYPERLINK(\"\"x\"\")\",1,,\r\n",
                "ZONE_BREACH,\"' @Road \"\"A\"\"\",1,,\r\n");
    }
}
