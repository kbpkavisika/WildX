package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.PatrolRoute;
import com.wildx.wildx.repository.PatrolRouteRepository;
import com.wildx.wildx.service.*;
import com.wildx.wildx.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatrolRouteServiceImpl implements PatrolRouteService {
    private final PatrolRouteRepository repository;
    private final ParkService parks;

    @Override
    @Transactional
    public PatrolRouteResponse create(Long parkId, PatrolRouteRequest request) {
        log.info("create route started parkId={}", parkId);
        GeoUtil.line(request.pathGeojson());
        PatrolRoute route = new PatrolRoute();
        route.setPark(parks.require(parkId));
        route.setName(request.name().strip());
        route.setPathGeojson(request.pathGeojson());
        PatrolRouteResponse response = PatrolRouteResponse.from(repository.save(route));
        log.info("create route completed routeId={}", response.id());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatrolRouteResponse> list(Long parkId) {
        log.info("list routes started parkId={}", parkId);
        var routes = repository.findByParkIdOrderByNameAscIdAsc(parkId).stream().map(PatrolRouteResponse::from).toList();
        log.info("list routes completed parkId={}", parkId);
        return routes;
    }

    @Override
    @Transactional(readOnly = true)
    public PatrolRoute require(Long id, Long parkId) {
        return repository.findByIdAndParkId(id, parkId).orElseThrow(() -> new NotFoundException("Route not found"));
    }
}
