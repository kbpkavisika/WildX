package com.wildx.wildx.service;

import com.wildx.wildx.dto.AlertResponse;
import com.wildx.wildx.model.CollarFix;
import com.wildx.wildx.type.AlertStatus;
import java.util.List;

public interface AlertService {
    void raiseZoneBreaches(CollarFix fix);
    List<AlertResponse> alerts(Long parkId, AlertStatus status);
    AlertResponse acknowledge(Long parkId, Long alertId, Long userId);
}
