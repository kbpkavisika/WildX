package com.wildx.wildx.util;

import com.wildx.wildx.type.ReportType;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

public final class SmsParser {
    public static final String HELP_MESSAGE = "WildX: send TYPE LANDMARK COUNT e.g. ELE KUMB 3. Types: ELE/ALI/YANAI, CROP/GOVI/PAYIR.";

    private static final Map<String, ReportType> KEYWORDS = Map.of(
            "ELE", ReportType.SIGHTING,
            "ALI", ReportType.SIGHTING,
            "YANAI", ReportType.SIGHTING,
            "CROP", ReportType.CROP_DAMAGE,
            "GOVI", ReportType.CROP_DAMAGE,
            "PAYIR", ReportType.CROP_DAMAGE,
            "HELP", ReportType.OTHER,
            "UDAW", ReportType.OTHER,
            "UTHAVI", ReportType.OTHER
    );

    private SmsParser() {}

    public record ParsedSms(ReportType type, String landmarkCode, int count) {}

    public static Optional<ParsedSms> parse(String text) {
        if (text == null) {
            return Optional.empty();
        }
        String trimmed = text.strip();
        if (trimmed.isEmpty()) {
            return Optional.empty();
        }
        String[] parts = trimmed.split("\\s+");
        if (parts.length < 2) {
            return Optional.empty();
        }

        String typeToken = parts[0].toUpperCase(Locale.ROOT);
        ReportType type = KEYWORDS.get(typeToken);
        if (type == null) {
            return Optional.empty();
        }

        String landmark = parts[1].toUpperCase(Locale.ROOT);

        int count = 1;
        if (parts.length >= 3) {
            try {
                count = Integer.parseInt(parts[2]);
                if (count <= 0) {
                    return Optional.empty();
                }
            } catch (NumberFormatException ex) {
                return Optional.empty();
            }
        }

        return Optional.of(new ParsedSms(type, landmark, count));
    }
}
