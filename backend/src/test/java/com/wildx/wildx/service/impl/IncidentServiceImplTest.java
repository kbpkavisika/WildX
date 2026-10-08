package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.IncidentCreateRequest;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.IncidentRepository;
import com.wildx.wildx.repository.IncidentTypeRepository;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.FileStorage;
import com.wildx.wildx.service.NotificationService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.service.PatrolService;
import com.wildx.wildx.type.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class IncidentServiceImplTest {
    private static final Instant NOW = Instant.parse("2026-10-08T04:00:00Z");
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1};
    private static final String SQUARE = "{\"type\":\"Polygon\",\"coordinates\":[[[81,6],[82,6],[82,7],[81,7],[81,6]]]}";

    private final IncidentRepository incidents = mock(IncidentRepository.class);
    private final IncidentTypeRepository types = mock(IncidentTypeRepository.class);
    private final AuthService auth = mock(AuthService.class);
    private final ParkService parks = mock(ParkService.class);
    private final PatrolService patrols = mock(PatrolService.class);
    private final NotificationService notifications = mock(NotificationService.class);
    private final FileStorage storage = mock(FileStorage.class);
    private final IncidentServiceImpl service = new IncidentServiceImpl(incidents, types, auth, parks, patrols,
            notifications, storage, Clock.fixed(NOW, ZoneOffset.UTC));
    private final UserResponse ranger = new UserResponse(7L, "Ranger", "ranger@wildx.lk", Role.RANGER, 1L);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();
    private final IncidentType snare = new IncidentType();
    private final AppUser reporter = AppUser.builder().id(7L).name("Ranger").role(Role.RANGER).park(park).active(true).build();

    @BeforeEach
    void setUp() {
        snare.setId(4L);
        snare.setPark(park);
        snare.setName("Snare");
        snare.setDefaultSeverity(Severity.HIGH);
        snare.setActive(true);
        when(types.findByIdAndParkId(4L, 1L)).thenReturn(Optional.of(snare));
        when(auth.requireRanger(7L, 1L)).thenReturn(reporter);
        when(incidents.save(any())).thenAnswer(call -> {
            Incident incident = call.getArgument(0);
            incident.setId(10L);
            return incident;
        });
    }

    @Test
    void reportsGpsIncidentWithPhotoSectorAndTypeDefaultSeverity() {
        Sector sector = new Sector();
        sector.setId(2L);
        sector.setName("Sector 3");
        sector.setPolygonGeojson(SQUARE);
        when(parks.sectorShapes(1L)).thenReturn(List.of(sector));
        when(storage.save("incidents/1", "jpg", JPEG)).thenReturn("incidents/1/a.jpg");
        Patrol patrol = new Patrol();
        patrol.setId(3L);
        when(patrols.activePatrol(7L, 1L)).thenReturn(Optional.of(patrol));
        Instant seen = NOW.minusSeconds(60);

        var result = service.report(ranger, new IncidentCreateRequest(4L, 6.5, 81.5, LocationSource.GPS,
                " Wire snare near waterhole ", seen), JPEG);

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.typeName()).isEqualTo("Snare");
        assertThat(result.reporterId()).isEqualTo(7L);
        assertThat(result.patrolId()).isEqualTo(3L);
        assertThat(result.severity()).isEqualTo(Severity.HIGH);
        assertThat(result.status()).isEqualTo(IncidentStatus.NEW);
        assertThat(result.sectorName()).isEqualTo("Sector 3");
        assertThat(result.locationSource()).isEqualTo(LocationSource.GPS);
        assertThat(result.description()).isEqualTo("Wire snare near waterhole");
        assertThat(result.photoPath()).isEqualTo("incidents/1/a.jpg");
        assertThat(result.occurredAt()).isEqualTo(seen);
    }

    @Test
    void notifiesSupervisorsAndManagersOfHighAndCriticalIncidents() {
        Sector sector = new Sector();
        sector.setId(2L);
        sector.setName("Sector 3");
        sector.setPolygonGeojson(SQUARE);
        when(parks.sectorShapes(1L)).thenReturn(List.of(sector));
        when(auth.activeUserIds(1L, Role.SUPERVISOR)).thenReturn(List.of(2L));
        when(auth.activeUserIds(1L, Role.MANAGER)).thenReturn(List.of(3L));

        service.report(ranger, request(4L, null), null);
        verify(notifications).notifyUsers(List.of(2L, 3L), "New HIGH incident", "Snare, Sector 3", "/dashboard/incidents");

        snare.setDefaultSeverity(Severity.CRITICAL);
        when(parks.sectorShapes(1L)).thenReturn(List.of());
        service.report(ranger, request(4L, null), null);
        verify(notifications).notifyUsers(List.of(2L, 3L), "New CRITICAL incident", "Snare", "/dashboard/incidents");
    }

    @Test
    void doesNotNotifyForLowOrMediumIncidents() {
        snare.setDefaultSeverity(Severity.MEDIUM);
        service.report(ranger, request(4L, null), null);
        snare.setDefaultSeverity(Severity.LOW);
        service.report(ranger, request(4L, null), null);
        verify(incidents, times(2)).save(any());
        verifyNoInteractions(notifications);
        verify(auth, never()).activeUserIds(any(), any());
    }

    @Test
    void reportsManualLocationOutsideSectorsWithoutPhotoOrPatrolAtCurrentTime() {
        when(parks.sectorShapes(1L)).thenReturn(List.of());
        when(patrols.activePatrol(7L, 1L)).thenReturn(Optional.empty());

        var result = service.report(ranger, new IncidentCreateRequest(4L, 6.5, 81.5, LocationSource.MANUAL, "  ", null), null);

        ArgumentCaptor<Incident> saved = ArgumentCaptor.forClass(Incident.class);
        verify(incidents).save(saved.capture());
        assertThat(saved.getValue().getPark()).isEqualTo(park);
        assertThat(result.locationSource()).isEqualTo(LocationSource.MANUAL);
        assertThat(result.sectorId()).isNull();
        assertThat(result.patrolId()).isNull();
        assertThat(result.description()).isNull();
        assertThat(result.photoPath()).isNull();
        assertThat(result.occurredAt()).isEqualTo(NOW);
        verifyNoInteractions(storage);
    }

    @Test
    void rejectsFutureTimeBadPhotoAndUnknownOrInactiveTypeBeforeSaving() {
        assertThatThrownBy(() -> service.report(ranger, request(4L, NOW.plusSeconds(1)), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Incident time must not be in the future");
        assertThatThrownBy(() -> service.report(ranger, request(4L, null), new byte[] {1, 2, 3}))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Only JPEG and PNG images are accepted");
        when(types.findByIdAndParkId(9L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.report(ranger, request(9L, null), null))
                .isInstanceOf(NotFoundException.class).hasMessage("Incident type not found");
        snare.setActive(false);
        assertThatThrownBy(() -> service.report(ranger, request(4L, null), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Incident type is not active");
        verify(incidents, never()).save(any());
        verifyNoInteractions(storage, notifications);
    }

    private IncidentCreateRequest request(Long typeId, Instant occurredAt) {
        return new IncidentCreateRequest(typeId, 6.5, 81.5, LocationSource.GPS, null, occurredAt);
    }
}
