package com.wildx.wildx.service;

import com.wildx.wildx.dto.PatrolHistoryResponse;
import java.util.List;

public interface PatrolHistoryService {
    List<PatrolHistoryResponse> history(Long parkId);
}
