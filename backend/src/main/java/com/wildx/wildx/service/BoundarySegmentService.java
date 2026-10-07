package com.wildx.wildx.service;

import com.wildx.wildx.dto.BoundarySegmentRequest;
import com.wildx.wildx.dto.BoundarySegmentResponse;
import com.wildx.wildx.model.BoundarySegment;

import java.util.List;
import java.util.Optional;

public interface BoundarySegmentService {
    List<BoundarySegmentResponse> segments(Long parkId);

    BoundarySegmentResponse createSegment(Long parkId, BoundarySegmentRequest request);

    BoundarySegmentResponse updateSegment(Long parkId, Long segmentId, BoundarySegmentRequest request);

    void deleteSegment(Long parkId, Long segmentId);

    BoundarySegment require(Long id, Long parkId);

    Optional<BoundarySegment> findByCode(Long parkId, String code);

    Optional<BoundarySegment> findNearest(Long parkId, double lat, double lng);
}
