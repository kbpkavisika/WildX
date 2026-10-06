package com.wildx.wildx.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import static org.assertj.core.api.Assertions.assertThat;

class JpaAuditingConfigTest {

    private final AuditorAware<Long> auditorAware = new JpaAuditingConfig().auditorAware();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void auditorIsUserIdFromJwtSubject() {
        Jwt jwt = Jwt.withTokenValue("token").header("alg", "HS256").subject("42").build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));

        assertThat(auditorAware.getCurrentAuditor()).contains(42L);
    }

    @Test
    void noAuditorWhenUnauthenticated() {
        assertThat(auditorAware.getCurrentAuditor()).isEmpty();
    }

    @Test
    void noAuditorForNonJwtAuthentication() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("someone", null));

        assertThat(auditorAware.getCurrentAuditor()).isEmpty();
    }
}
