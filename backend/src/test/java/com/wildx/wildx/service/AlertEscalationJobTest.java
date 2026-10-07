package com.wildx.wildx.service;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.mockito.Mockito.*;

class AlertEscalationJobTest {
    private final AlertEscalationService escalation = mock(AlertEscalationService.class);
    private final AlertEscalationJob job = new AlertEscalationJob(escalation);

    @Test
    void escalatesEveryOverdueAlertEvenWhenOneFails() {
        when(escalation.overdueAlertIds()).thenReturn(List.of(20L, 21L, 22L));
        doThrow(new IllegalStateException("broken alert")).when(escalation).escalate(21L);
        job.run();
        verify(escalation).escalate(20L);
        verify(escalation).escalate(21L);
        verify(escalation).escalate(22L);
    }

    @Test
    void doesNothingWithoutOverdueAlerts() {
        when(escalation.overdueAlertIds()).thenReturn(List.of());
        job.run();
        verify(escalation, never()).escalate(any());
    }
}
