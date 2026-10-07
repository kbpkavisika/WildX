package com.wildx.wildx.service;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.mockito.Mockito.*;

class DeviceHealthJobTest {
    private final DeviceHealthService health = mock(DeviceHealthService.class);
    private final DeviceHealthJob job = new DeviceHealthJob(health);

    @Test
    void checksEveryReportedDeviceEvenWhenOneFails() {
        when(health.reportedDeviceIds()).thenReturn(List.of(3L, 4L, 5L));
        doThrow(new IllegalStateException("broken device")).when(health).check(4L);
        job.run();
        verify(health).check(3L);
        verify(health).check(4L);
        verify(health).check(5L);
    }

    @Test
    void doesNothingWithoutReportedDevices() {
        when(health.reportedDeviceIds()).thenReturn(List.of());
        job.run();
        verify(health, never()).check(any());
    }
}
