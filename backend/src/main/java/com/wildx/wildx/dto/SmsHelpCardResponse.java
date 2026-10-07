package com.wildx.wildx.dto;

import java.util.List;

public record SmsHelpCardResponse(
        Long parkId,
        String parkName,
        String shortCode,
        String format,
        String example,
        String helpReply,
        List<KeywordHelp> keywords,
        List<LandmarkHelp> landmarks
) {
    public record KeywordHelp(
            String type,
            String label,
            String english,
            String sinhala,
            String tamil
    ) {}

    public record LandmarkHelp(
            Long id,
            String code,
            String name,
            Double centerLat,
            Double centerLng
    ) {}
}
