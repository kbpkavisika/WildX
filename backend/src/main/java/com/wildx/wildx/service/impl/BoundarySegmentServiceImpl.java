package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.BoundarySegmentRequest;
import com.wildx.wildx.dto.BoundarySegmentResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.BoundarySegment;
import com.wildx.wildx.repository.BoundarySegmentRepository;
import com.wildx.wildx.service.BoundarySegmentService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.util.GeoUtil;
import com.wildx.wildx.util.PatrolMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoundarySegmentServiceImpl implements BoundarySegmentService {
    private final ParkService parks;
    private final BoundarySegmentRepository segments;

    @Override
    @Transactional(readOnly = true)
    public List<BoundarySegmentResponse> segments(Long parkId) {
        log.info("list boundary segments started parkId={}", parkId);
        var response = segments.findByParkIdOrderByNameAscIdAsc(parkId).stream()
                .map(BoundarySegmentResponse::from)
                .toList();
        log.info("list boundary segments completed parkId={}", parkId);
        return response;
    }

    @Override
    @Transactional
    public BoundarySegmentResponse createSegment(Long parkId, BoundarySegmentRequest request) {
        log.info("create boundary segment started parkId={}", parkId);
        String code = request.code().strip().toUpperCase(Locale.ROOT);
        if (segments.existsByParkIdAndCodeIgnoreCase(parkId, code)) {
            throw new IllegalArgumentException("Segment code already exists in this park");
        }
        BoundarySegment segment = new BoundarySegment();
        segment.setPark(parks.require(parkId));
        apply(segment, request, code);
        BoundarySegmentResponse response = BoundarySegmentResponse.from(segments.save(segment));
        log.info("create boundary segment completed segmentId={}", response.id());
        return response;
    }

    @Override
    @Transactional
    public BoundarySegmentResponse updateSegment(Long parkId, Long segmentId, BoundarySegmentRequest request) {
        log.info("update boundary segment started segmentId={}", segmentId);
        BoundarySegment segment = require(segmentId, parkId);
        String code = request.code().strip().toUpperCase(Locale.ROOT);
        if (segments.existsByParkIdAndCodeIgnoreCaseAndIdNot(parkId, code, segmentId)) {
            throw new IllegalArgumentException("Segment code already exists in this park");
        }
        apply(segment, request, code);
        log.info("update boundary segment completed segmentId={}", segmentId);
        return BoundarySegmentResponse.from(segment);
    }

    @Override
    @Transactional
    public void deleteSegment(Long parkId, Long segmentId) {
        log.info("delete boundary segment started segmentId={}", segmentId);
        BoundarySegment segment = require(segmentId, parkId);
        segments.delete(segment);
        segments.flush();
        log.info("delete boundary segment completed segmentId={}", segmentId);
    }

    @Override
    @Transactional(readOnly = true)
    public BoundarySegment require(Long id, Long parkId) {
        return segments.findByIdAndParkId(id, parkId)
                .orElseThrow(() -> new NotFoundException("Boundary segment not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BoundarySegment> findByCode(Long parkId, String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        return segments.findByParkIdAndCodeIgnoreCase(parkId, code.strip().toUpperCase(Locale.ROOT));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BoundarySegment> findNearest(Long parkId, double lat, double lng) {
        GeoUtil.Point target = new GeoUtil.Point(lng, lat);
        return segments.findByParkIdOrderByNameAscIdAsc(parkId).stream()
                .min(Comparator.comparingDouble(s -> PatrolMetrics.between(
                        target,
                        new GeoUtil.Point(s.getCenterLng(), s.getCenterLat())
                )));
    }

    private void apply(BoundarySegment segment, BoundarySegmentRequest request, String code) {
        segment.setName(request.name().strip());
        segment.setCode(code);
        segment.setCenterLat(request.centerLat());
        segment.setCenterLng(request.centerLng());
    }
}
