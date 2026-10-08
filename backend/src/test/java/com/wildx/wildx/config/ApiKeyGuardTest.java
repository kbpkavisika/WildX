package com.wildx.wildx.config;

import com.wildx.wildx.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ApiKeyGuardTest {
    @Test
    void acceptsOnlyTheConfiguredKey() {
        ApiKeyGuard guard = new ApiKeyGuard("test-key");
        assertThatCode(() -> guard.require("test-key")).doesNotThrowAnyException();
        assertThatThrownBy(() -> guard.require("wrong")).isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid API key");
        assertThatThrownBy(() -> guard.require(null)).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void rejectsEverythingWhenNoKeyIsConfigured() {
        ApiKeyGuard guard = new ApiKeyGuard("");
        assertThatThrownBy(() -> guard.require("")).isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> guard.require("anything")).isInstanceOf(UnauthorizedException.class);
    }
}
