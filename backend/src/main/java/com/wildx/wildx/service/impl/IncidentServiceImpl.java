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

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponse> list(Long parkId, IncidentStatus status, Long typeId, Severity severity) {
        log.info("list incidents started parkId={} status={} typeId={} severity={}", parkId, status, typeId, severity);
        var response = incidents.findByParkIdOrderByOccurredAtDescIdDesc(parkId).stream()
                .filter(incident -> status == null || incident.getStatus() == status)
                .filter(incident -> typeId == null || incident.getType().getId().equals(typeId))
                .filter(incident -> severity == null || incident.getSeverity() == severity)
                .map(IncidentResponse::from).toList();
        log.info("list incidents completed parkId={} count={}", parkId, response.size());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public IncidentResponse get(Long parkId, Long id) {
        log.info("get incident started incidentId={}", id);
        IncidentResponse response = IncidentResponse.from(requireIncident(parkId, id));
        log.info("get incident completed incidentId={}", id);
        return response;
    }

    @Override
    @Transactional
    public IncidentResponse changeSeverity(Long parkId, Long id, Severity severity) {
        log.info("change incident severity started incidentId={} severity={}", id, severity);
        Incident incident = requireIncident(parkId, id);
        if (incident.getStatus() == IncidentStatus.RESOLVED || incident.getStatus() == IncidentStatus.DISMISSED) {
            throw new IllegalStateException("Incident severity cannot change in status " + incident.getStatus());
        }
        incident.setSeverity(severity);
        log.info("change incident severity completed incidentId={}", id);
        return IncidentResponse.from(incident);
    }

    @Override
    @Transactional
    public IncidentResponse dismiss(Long parkId, Long id, String reason) {
        log.info("dismiss incident started incidentId={}", id);
        Incident incident = requireNew(parkId, id, "dismissed");
        incident.setStatus(IncidentStatus.DISMISSED);
        incident.setResolutionNote(reason.strip());
        log.info("dismiss incident completed incidentId={}", id);
        return IncidentResponse.from(incident);
    }

    @Override
    @Transactional
    public Incident assign(Long parkId, Long id) {
        Incident incident = requireNew(parkId, id, "dispatched");
        incident.setStatus(IncidentStatus.ASSIGNED);
        return incident;
    }

    @Override
    @Transactional
    public void resolve(Long id, String outcome) {
        incidents.findById(id).filter(incident -> incident.getStatus() == IncidentStatus.ASSIGNED).ifPresent(incident -> {
            incident.setStatus(IncidentStatus.RESOLVED);
            incident.setResolutionNote(outcome);
            log.info("incident resolved incidentId={}", id);
        });
    }

    @Override
    @Transactional
    public void reopen(Long id) {
        incidents.findById(id).filter(incident -> incident.getStatus() == IncidentStatus.ASSIGNED).ifPresent(incident -> {
            incident.setStatus(IncidentStatus.NEW);
            log.info("incident reopened incidentId={}", id);
        });
    }

    private Incident requireNew(Long parkId, Long id, String action) {
        Incident incident = requireIncident(parkId, id);
        if (incident.getStatus() != IncidentStatus.NEW) {
            throw new IllegalStateException("Incident cannot be " + action + " in status " + incident.getStatus());
        }
        return incident;
    }

    private Incident requireIncident(Long parkId, Long id) {
        return incidents.findByIdAndParkId(id, parkId).orElseThrow(() -> new NotFoundException("Incident not found"));
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
