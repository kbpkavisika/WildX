package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.type.SourceType;

import java.util.List;

public interface DispatchService {
    List<ResponderResponse> getResponders(Long parkId, Double lat, Double lng);

    DispatchResponse createDispatch(UserResponse caller, DispatchCreateRequest request);

    List<DispatchResponse> getMyDispatches(Long responderId);

    List<DispatchResponse> getDispatches(UserResponse caller, SourceType sourceType, Long sourceId);

    DispatchResponse getDispatch(UserResponse caller, Long id);

    DispatchResponse acknowledgeDispatch(UserResponse caller, Long id);

    DispatchResponse completeDispatch(UserResponse caller, Long id, DispatchCompleteRequest request);

    DispatchResponse declineDispatch(UserResponse caller, Long id, DispatchDeclineRequest request);
}
