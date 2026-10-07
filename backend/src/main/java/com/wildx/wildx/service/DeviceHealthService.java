package com.wildx.wildx.service;

import java.util.List;

public interface DeviceHealthService {
    List<Long> reportedDeviceIds();
    void check(Long deviceId);
}
