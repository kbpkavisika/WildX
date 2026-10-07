package com.wildx.wildx.controller;

import com.wildx.wildx.dto.CollarFixRequest;
import com.wildx.wildx.dto.CollarFixResponse;
import com.wildx.wildx.exception.UnauthorizedException;
import com.wildx.wildx.service.CollarFixService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/v1/ingest")
public class CollarIngestController {
    private static final String API_KEY_HEADER = "X-Api-Key";

    private final CollarFixService collarFixes;
    private final String apiKey;

    public CollarIngestController(CollarFixService collarFixes, @Value("${wildx.ingest-api-key:}") String apiKey) {
        this.collarFixes = collarFixes;
        this.apiKey = apiKey;
    }

    @PostMapping(value = "/collar-fixes", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CollarFixResponse> ingest(@RequestHeader(value = API_KEY_HEADER, required = false) String key,
                                                    @Valid @RequestBody CollarFixRequest request) {
        requireApiKey(key);
        CollarFixResponse response = collarFixes.ingest(request);
        return ResponseEntity.status(response.stored() ? HttpStatus.CREATED : HttpStatus.OK).body(response);
    }

    private void requireApiKey(String key) {
        if (apiKey.isBlank() || key == null
                || !MessageDigest.isEqual(apiKey.getBytes(StandardCharsets.UTF_8), key.getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("Invalid API key");
        }
    }
}
