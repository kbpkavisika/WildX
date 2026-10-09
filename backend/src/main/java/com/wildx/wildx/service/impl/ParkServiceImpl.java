package com.wildx.wildx.service.impl;

import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.service.ParkService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.model.Sector;
import com.wildx.wildx.repository.SectorRepository;
import com.wildx.wildx.util.GeoUtil;
import java.util.List;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParkServiceImpl implements ParkService {
    private final ParkRepository repository;
    private final SectorRepository sectors;

    @Override
    @Transactional(readOnly = true)
    public Park require(Long parkId) {
        return repository.findById(parkId).orElseThrow(() -> new NotFoundException("Park not found"));
    }

    @Override
    @Transactional
    public Park create(ParkRequest request) {
        log.info("create park started");
        Park park = repository.saveAndFlush(Park.builder().name(request.name().strip())
                .code(request.code().strip().toUpperCase(Locale.ROOT)).build());
        log.info("create park completed parkId={}", park.getId());
        return park;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SectorResponse> sectors(Long parkId) {
        log.info("list sectors started parkId={}", parkId);
        var response = sectors.findByParkIdOrderByIdAsc(parkId).stream().map(SectorResponse::from).toList();
        log.info("list sectors completed parkId={}", parkId);
        return response;
    }

    @Override
    @Transactional
    public SectorResponse createSector(Long parkId, SectorRequest request) {
        log.info("create sector started parkId={}", parkId);
        GeoUtil.polygon(request.polygonGeojson());
        Sector sector = new Sector();
        sector.setPark(require(parkId));
        apply(sector, request);
        SectorResponse response = SectorResponse.from(sectors.save(sector));
        log.info("create sector completed sectorId={}", response.id());
        return response;
    }

    @Override
    @Transactional
    public SectorResponse updateSector(Long parkId, Long sectorId, SectorRequest request) {
        log.info("update sector started sectorId={}", sectorId);
        GeoUtil.polygon(request.polygonGeojson());
        Sector sector = requireSector(parkId, sectorId);
        apply(sector, request);
        log.info("update sector completed sectorId={}", sectorId);
        return SectorResponse.from(sector);
    }

    @Override
    @Transactional
    public void deleteSector(Long parkId, Long sectorId) {
        log.info("delete sector started sectorId={}", sectorId);
        sectors.delete(requireSector(parkId, sectorId));
        sectors.flush();
        log.info("delete sector completed sectorId={}", sectorId);
    }

    @Override
    @Transactional(readOnly = true)
    public int neglectDays(Long parkId) {
        return require(parkId).getNeglectDays();
    }

    @Override
    @Transactional
    public void updateCoverageSettings(Long parkId, CoverageSettingsRequest request) {
        log.info("update coverage settings started parkId={}", parkId);
        if (request.neglectDays() == null || request.neglectDays() < 1 || request.neglectDays() > 3650) {
            throw new IllegalArgumentException("Neglect days must be between 1 and 3650");
        }
        require(parkId).setNeglectDays(request.neglectDays());
        log.info("update coverage settings completed parkId={}", parkId);
    }

    private Sector requireSector(Long parkId, Long sectorId) {
        return sectors.findByIdAndParkId(sectorId, parkId).orElseThrow(() -> new NotFoundException("Sector not found"));
    }

    private void apply(Sector sector, SectorRequest request) {
        sector.setName(request.name().strip());
        sector.setPolygonGeojson(request.polygonGeojson());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Sector> sectorShapes(Long parkId) {
        return sectors.findByParkIdOrderByIdAsc(parkId);
    }
}
