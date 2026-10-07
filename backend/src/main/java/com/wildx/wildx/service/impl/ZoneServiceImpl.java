package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.Zone;
import com.wildx.wildx.repository.ZoneRepository;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.service.ZoneService;
import com.wildx.wildx.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ZoneServiceImpl implements ZoneService {
    private final ParkService parks;
    private final ZoneRepository zones;

    @Override
    @Transactional(readOnly = true)
    public List<ZoneResponse> zones(Long parkId) {
        log.info("list zones started parkId={}", parkId);
        var response = zones.findByParkIdOrderByNameAscIdAsc(parkId).stream().map(ZoneResponse::from).toList();
        log.info("list zones completed parkId={}", parkId);
        return response;
    }

    @Override
    @Transactional
    public ZoneResponse createZone(Long parkId, ZoneRequest request) {
        log.info("create zone started parkId={}", parkId);
        GeoUtil.polygon(request.polygonGeojson());
        Zone zone = new Zone();
        zone.setPark(parks.require(parkId));
        apply(zone, request);
        ZoneResponse response = ZoneResponse.from(zones.save(zone));
        log.info("create zone completed zoneId={}", response.id());
        return response;
    }

    @Override
    @Transactional
    public ZoneResponse updateZone(Long parkId, Long zoneId, ZoneRequest request) {
        log.info("update zone started zoneId={}", zoneId);
        GeoUtil.polygon(request.polygonGeojson());
        Zone zone = requireZone(parkId, zoneId);
        apply(zone, request);
        log.info("update zone completed zoneId={}", zoneId);
        return ZoneResponse.from(zone);
    }

    @Override
    @Transactional
    public void deleteZone(Long parkId, Long zoneId) {
        log.info("delete zone started zoneId={}", zoneId);
        zones.delete(requireZone(parkId, zoneId));
        zones.flush();
        log.info("delete zone completed zoneId={}", zoneId);
    }

    private Zone requireZone(Long parkId, Long zoneId) {
        return zones.findByIdAndParkId(zoneId, parkId).orElseThrow(() -> new NotFoundException("Zone not found"));
    }

    private void apply(Zone zone, ZoneRequest request) {
        zone.setName(request.name().strip());
        zone.setType(request.type());
        zone.setPolygonGeojson(request.polygonGeojson());
    }
}
