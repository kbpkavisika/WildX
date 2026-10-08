package com.wildx.wildx.controller;

import com.wildx.wildx.dto.SmsIngestRequest;
import com.wildx.wildx.dto.SmsIngestResponse;
import com.wildx.wildx.exception.UnauthorizedException;
import com.wildx.wildx.service.SmsService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/v1/ingest/sms")
public class SmsController {
    private static final String API_KEY_HEADER = "X-Api-Key";

    private final SmsService sms;
    private final String apiKey;

    public SmsController(SmsService sms, @Value("${wildx.ingest-api-key:}") String apiKey) {
        this.sms = sms;
        this.apiKey = apiKey;
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SmsIngestResponse> ingest(
            @RequestHeader(value = API_KEY_HEADER, required = false) String key,
            @Valid @RequestBody SmsIngestRequest request
    ) {
        requireApiKey(key);
        return ResponseEntity.ok(sms.processInbound(request));
    }

    private void requireApiKey(String key) {
        if (apiKey.isBlank() || key == null
                || !MessageDigest.isEqual(apiKey.getBytes(StandardCharsets.UTF_8), key.getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("Invalid API key");
        }
    }
}
