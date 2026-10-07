package com.wildx.wildx.dto;

import java.time.Instant;

public record CollarFixResponse(Long deviceId, String collarCode, Instant recordedAt, boolean stored) {}
