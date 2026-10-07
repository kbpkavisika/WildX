package com.wildx.wildx.dto;

import jakarta.validation.constraints.NotBlank;

public record SmsIngestRequest(
        @NotBlank String from,
        String body,
        String message,
        Long parkId
) {
    public String content() {
        if (body != null && !body.isBlank()) {
            return body;
        }
        return message != null ? message : "";
    }
}
