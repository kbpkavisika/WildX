package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.IncidentType;
import com.wildx.wildx.repository.IncidentTypeRepository;
import com.wildx.wildx.service.IncidentTypeService;
import com.wildx.wildx.service.ParkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class IncidentTypeServiceImpl implements IncidentTypeService {
    private final ParkService parks;
    private final IncidentTypeRepository types;

    @Override
    @Transactional(readOnly = true)
    public List<IncidentTypeResponse> types(Long parkId) {
        log.info("list incident types started parkId={}", parkId);
        var response = types.findByParkIdOrderByNameAscIdAsc(parkId).stream().map(IncidentTypeResponse::from).toList();
        log.info("list incident types completed parkId={} count={}", parkId, response.size());
        return response;
    }

    @Override
    @Transactional
    public IncidentTypeResponse createType(Long parkId, IncidentTypeRequest request) {
        log.info("create incident type started parkId={}", parkId);
        IncidentType type = new IncidentType();
        type.setPark(parks.require(parkId));
        apply(type, request);
        IncidentTypeResponse response = IncidentTypeResponse.from(types.saveAndFlush(type));
        log.info("create incident type completed typeId={}", response.id());
        return response;
    }

    @Override
    @Transactional
    public IncidentTypeResponse updateType(Long parkId, Long typeId, IncidentTypeRequest request) {
        log.info("update incident type started typeId={}", typeId);
        IncidentType type = requireType(parkId, typeId);
        apply(type, request);
        types.flush();
        log.info("update incident type completed typeId={}", typeId);
        return IncidentTypeResponse.from(type);
    }

    @Override
    @Transactional
    public void deleteType(Long parkId, Long typeId) {
        log.info("delete incident type started typeId={}", typeId);
        types.delete(requireType(parkId, typeId));
        types.flush();
        log.info("delete incident type completed typeId={}", typeId);
    }

    private IncidentType requireType(Long parkId, Long typeId) {
        return types.findByIdAndParkId(typeId, parkId).orElseThrow(() -> new NotFoundException("Incident type not found"));
    }

    private void apply(IncidentType type, IncidentTypeRequest request) {
        type.setName(request.name().strip());
        type.setDefaultSeverity(request.defaultSeverity());
        type.setActive(request.active());
    }
}
