package com.wildx.wildx.service;

import com.wildx.wildx.model.Park;
import com.wildx.wildx.model.Sector;
import com.wildx.wildx.dto.*;
import java.util.List;

public interface ParkService {
    Park require(Long parkId);
    List<SectorResponse> sectors(Long parkId);
    SectorResponse createSector(Long parkId, SectorRequest request);
    SectorResponse updateSector(Long parkId, Long sectorId, SectorRequest request);
    void deleteSector(Long parkId, Long sectorId);
    int neglectDays(Long parkId);
    void updateCoverageSettings(Long parkId, CoverageSettingsRequest request);
    List<Sector> sectorShapes(Long parkId);
}

