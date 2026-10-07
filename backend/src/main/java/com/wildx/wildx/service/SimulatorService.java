package com.wildx.wildx.service;

import com.wildx.wildx.dto.CameraSimulationRequest;
import com.wildx.wildx.dto.SimulationRequest;
import com.wildx.wildx.dto.SimulationResponse;

public interface SimulatorService {
    SimulationResponse simulate(Long parkId, SimulationRequest request);
    SimulationResponse simulateCamera(Long parkId, CameraSimulationRequest request);
}
