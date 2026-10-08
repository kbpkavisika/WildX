package com.wildx.wildx.controller;

import com.wildx.wildx.config.ApiKeyGuard;
import com.wildx.wildx.dto.CollarFixRequest;
import com.wildx.wildx.dto.CollarFixResponse;
import com.wildx.wildx.service.CollarFixService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ingest")
@RequiredArgsConstructor
public class CollarIngestController {
    private final CollarFixService collarFixes;
    private final ApiKeyGuard apiKey;

    @PostMapping("/collar-fixes")
    public ResponseEntity<CollarFixResponse> ingest(@RequestHeader(value = ApiKeyGuard.HEADER, required = false) String key,
                                                    @Valid @RequestBody CollarFixRequest request) {
        apiKey.require(key);
        CollarFixResponse response = collarFixes.ingest(request);
        return ResponseEntity.status(response.stored() ? HttpStatus.CREATED : HttpStatus.OK).body(response);
    }
}
