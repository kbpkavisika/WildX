package com.wildx.wildx.dto;

public record SmsIngestResponse(
        String reply,
        String referenceCode,
        boolean parsed
) {}
