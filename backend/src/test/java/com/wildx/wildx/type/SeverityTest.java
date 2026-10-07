package com.wildx.wildx.type;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class SeverityTest {
    @Test
    void raisesOneLevelAndCapsAtCritical() {
        assertThat(Severity.LOW.raised()).isEqualTo(Severity.MEDIUM);
        assertThat(Severity.MEDIUM.raised()).isEqualTo(Severity.HIGH);
        assertThat(Severity.HIGH.raised()).isEqualTo(Severity.CRITICAL);
        assertThat(Severity.CRITICAL.raised()).isEqualTo(Severity.CRITICAL);
    }
}
