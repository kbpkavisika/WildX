package com.wildx.wildx.util;

import com.wildx.wildx.type.ReportType;
import org.junit.jupiter.api.Test;


import static org.assertj.core.api.Assertions.assertThat;

class SmsParserTest {

    @Test
    void parsesKeywordsInEnglishSinhalaAndTamil() {
        var ele = SmsParser.parse("ELE KUMB 3");
        assertThat(ele).contains(new SmsParser.ParsedSms(ReportType.SIGHTING, "KUMB", 3));

        var ali = SmsParser.parse("ali pal");
        assertThat(ali).contains(new SmsParser.ParsedSms(ReportType.SIGHTING, "PAL", 1));

        var yanai = SmsParser.parse("YaNaI KAT 5");
        assertThat(yanai).contains(new SmsParser.ParsedSms(ReportType.SIGHTING, "KAT", 5));

        var crop = SmsParser.parse("crop kumb 2");
        assertThat(crop).contains(new SmsParser.ParsedSms(ReportType.CROP_DAMAGE, "KUMB", 2));

        var govi = SmsParser.parse("GOVI PAL");
        assertThat(govi).contains(new SmsParser.ParsedSms(ReportType.CROP_DAMAGE, "PAL", 1));

        var payir = SmsParser.parse("payir kat 4");
        assertThat(payir).contains(new SmsParser.ParsedSms(ReportType.CROP_DAMAGE, "KAT", 4));

        var help = SmsParser.parse("help kumb");
        assertThat(help).contains(new SmsParser.ParsedSms(ReportType.OTHER, "KUMB", 1));

        var udaw = SmsParser.parse("UDAW PAL 1");
        assertThat(udaw).contains(new SmsParser.ParsedSms(ReportType.OTHER, "PAL", 1));

        var uthavi = SmsParser.parse("uthavi kat 2");
        assertThat(uthavi).contains(new SmsParser.ParsedSms(ReportType.OTHER, "KAT", 2));
    }

    @Test
    void handlesWhitespaceVariations() {
        var parsed = SmsParser.parse("   ELE    KUMB    7   ");
        assertThat(parsed).contains(new SmsParser.ParsedSms(ReportType.SIGHTING, "KUMB", 7));
    }

    @Test
    void rejectsInvalidSmsFormats() {
        assertThat(SmsParser.parse(null)).isEmpty();
        assertThat(SmsParser.parse("")).isEmpty();
        assertThat(SmsParser.parse("   ")).isEmpty();
        assertThat(SmsParser.parse("ELE")).isEmpty();
        assertThat(SmsParser.parse("UNKNOWN KUMB 2")).isEmpty();
        assertThat(SmsParser.parse("ELE KUMB 0")).isEmpty();
        assertThat(SmsParser.parse("ELE KUMB -5")).isEmpty();
        assertThat(SmsParser.parse("ELE KUMB three")).isEmpty();
    }

    @Test
    void exposesStandardHelpMessage() {
        assertThat(SmsParser.HELP_MESSAGE).contains("ELE/ALI/YANAI").contains("CROP/GOVI/PAYIR");
    }
}
