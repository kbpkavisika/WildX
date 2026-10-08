package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.IncidentCreateRequest;
import com.wildx.wildx.dto.IncidentResponse;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.Incident;
import com.wildx.wildx.model.IncidentType;
import com.wildx.wildx.model.Sector;
import com.wildx.wildx.repository.IncidentRepository;
import com.wildx.wildx.repository.IncidentTypeRepository;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.FileStorage;
import com.wildx.wildx.service.IncidentService;
import com.wildx.wildx.service.NotificationService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.service.PatrolService;
import com.wildx.wildx.type.IncidentStatus;
import com.wildx.wildx.type.Role;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class IncidentServiceImpl implements IncidentService {
    private static final String PHOTO_FOLDER = "incidents/";
    private static final String INCIDENTS_LINK = "/dashboard/incidents";

    private final IncidentRepository incidents;
    private final IncidentTypeRepository types;
    private final AuthService auth;
    private final ParkService parks;
    private final PatrolService patrols;
    private final NotificationService notifications;
    private final FileStorage storage;
    private final Clock clock;

    @Override
    @Transactional
    public IncidentResponse report(UserResponse caller, IncidentCreateRequest request, byte[] photo) {
        log.info("report incident started reporterId={} typeId={}", caller.id(), request.typeId());
        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        Instant occurredAt = request.occurredAt() == null ? now : request.occurredAt().truncatedTo(ChronoUnit.MICROS);
        if (occurredAt.isAfter(now)) {
            throw new IllegalArgumentException("Incident time must not be in the future");
        }
        String photoExtension = photo == null ? null : FileStorage.imageExtension(photo);
        IncidentType type = types.findByIdAndParkId(request.typeId(), caller.parkId())
                .orElseThrow(() -> new NotFoundException("Incident type not found"));
        if (!type.isActive()) {
            throw new IllegalArgumentException("Incident type is not active");
        }
        Incident incident = new Incident();
        incident.setReporter(auth.requireRanger(caller.id(), caller.parkId()));
        incident.setPatrol(patrols.activePatrol(caller.id(), caller.parkId()).orElse(null));
        incident.setPark(type.getPark());
        incident.setType(type);
        incident.setLat(request.lat());
        incident.setLng(request.lng());
        incident.setLocationSource(request.locationSource());
        incident.setSector(sectorAt(caller.parkId(), request.lat(), request.lng()));
        incident.setDescription(blankToNull(request.description()));
        incident.setSeverity(type.getDefaultSeverity());
        incident.setStatus(IncidentStatus.NEW);
        incident.setOccurredAt(occurredAt);
        if (photo != null) {
            incident.setPhotoPath(storage.save(PHOTO_FOLDER + caller.parkId(), photoExtension, photo));
        }
        IncidentResponse response = IncidentResponse.from(incidents.save(incident));
        notifyIfUrgent(response);
        log.info("report incident completed incidentId={} sectorId={} patrolId={}", response.id(), response.sectorId(),
                response.patrolId());
        return response;
    }

    private void notifyIfUrgent(IncidentResponse incident) {
        if (incident.severity() != Severity.HIGH && incident.severity() != Severity.CRITICAL) {
            return;
        }
        List<Long> recipients = new ArrayList<>(auth.activeUserIds(incident.parkId(), Role.SUPERVISOR));
        recipients.addAll(auth.activeUserIds(incident.parkId(), Role.MANAGER));
        String body = incident.sectorName() == null ? incident.typeName() : incident.typeName() + ", " + incident.sectorName();
        notifications.notifyUsers(recipients, "New " + incident.severity() + " incident", body, INCIDENTS_LINK);
    }

    private Sector sectorAt(Long parkId, double lat, double lng) {
        return parks.sectorShapes(parkId).stream()
                .filter(sector -> GeoUtil.contains(sector.getPolygonGeojson(), lat, lng))
                .findFirst().orElse(null);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
