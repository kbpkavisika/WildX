package com.wildx.wildx.service;

import com.wildx.wildx.model.CollarFix;

public interface AlertService {
    void raiseZoneBreaches(CollarFix fix);
}
