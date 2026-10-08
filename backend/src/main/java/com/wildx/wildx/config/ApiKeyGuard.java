package com.wildx.wildx.config;

import com.wildx.wildx.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class ApiKeyGuard {
    public static final String HEADER = "X-Api-Key";

    private final String apiKey;

    public ApiKeyGuard(@Value("${wildx.ingest-api-key:}") String apiKey) {
        this.apiKey = apiKey;
    }

    public void require(String key) {
        if (apiKey.isBlank() || key == null
                || !MessageDigest.isEqual(apiKey.getBytes(StandardCharsets.UTF_8), key.getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("Invalid API key");
        }
    }
}
