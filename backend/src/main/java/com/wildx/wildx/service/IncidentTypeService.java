package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import java.util.List;

public interface IncidentTypeService {
    List<IncidentTypeResponse> types(Long parkId);
    IncidentTypeResponse createType(Long parkId, IncidentTypeRequest request);
    IncidentTypeResponse updateType(Long parkId, Long typeId, IncidentTypeRequest request);
    void deleteType(Long parkId, Long typeId);
}
