package com.wildx.wildx.util;

import com.wildx.wildx.model.*;
import com.wildx.wildx.type.AlertType;
import com.wildx.wildx.type.Severity;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.assertj.core.api.Assertions.assertThat;

class AlertTextTest {
    @Test
    void titlesUseSeverityAndReadableType() {
        assertThat(AlertText.title("New", alert(AlertType.ZONE_BREACH, Severity.HIGH))).isEqualTo("New HIGH zone breach alert");
        assertThat(AlertText.title("Escalated", alert(AlertType.DEVICE_HEALTH, Severity.MEDIUM)))
                .isEqualTo("Escalated MEDIUM device health alert");
    }

    @Test
    void subjectsNameAnimalCollarAndZoneWhenKnown() {
        Animal gemunu = new Animal();
        gemunu.setName("Gemunu");
        Device collar = new Device();
        collar.setCode("COL-001");
        collar.setAnimal(gemunu);
        Device camera = new Device();
        camera.setCode("CAM-001");
        Zone farmland = new Zone();
        farmland.setName("Kumbukgaha farmland");

        Alert breach = alert(AlertType.ZONE_BREACH, Severity.HIGH);
        breach.setDevice(collar);
        breach.setZone(farmland);
        Alert mortality = alert(AlertType.MORTALITY, Severity.CRITICAL);
        mortality.setDevice(collar);
        Alert cameraHealth = alert(AlertType.DEVICE_HEALTH, Severity.MEDIUM);
        cameraHealth.setDevice(camera);
        Alert bare = alert(AlertType.DEVICE_HEALTH, Severity.MEDIUM);
        bare.setId(30L);

        assertThat(AlertText.subject(breach)).isEqualTo("Gemunu (COL-001) in Kumbukgaha farmland");
        assertThat(AlertText.subject(mortality)).isEqualTo("Gemunu (COL-001)");
        assertThat(AlertText.subject(cameraHealth)).isEqualTo("CAM-001");
        assertThat(AlertText.subject(bare)).isEqualTo("Alert 30");
    }

    @Test
    void timesAreColomboHoursAndMinutes() {
        assertThat(AlertText.time(Instant.parse("2026-10-07T16:35:59Z"))).isEqualTo("22:05");
    }

    private Alert alert(AlertType type, Severity severity) {
        Alert alert = new Alert();
        alert.setType(type);
        alert.setSeverity(severity);
        return alert;
    }
}
