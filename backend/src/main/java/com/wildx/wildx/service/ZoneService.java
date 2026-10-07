package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import java.util.List;

public interface ZoneService {
    List<ZoneResponse> zones(Long parkId);
    ZoneResponse createZone(Long parkId, ZoneRequest request);
    ZoneResponse updateZone(Long parkId, Long zoneId, ZoneRequest request);
    void deleteZone(Long parkId, Long zoneId);
}
