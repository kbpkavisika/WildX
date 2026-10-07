package com.wildx.wildx.dto;

public record PatrolHistoryResponse(PatrolResponse patrol, double distanceM, long durationSeconds) {}
