package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.service.PatrolHistoryService;
import com.wildx.wildx.type.PatrolStatus;
import com.wildx.wildx.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatrolHistoryServiceImpl implements PatrolHistoryService {
    private final PatrolRepository patrols;
    private final TrackPointRepository tracks;

    @Override
    @Transactional(readOnly = true)
    public List<PatrolHistoryResponse> history(Long parkId) {
        log.info("patrol history started parkId={}", parkId);
        var completed = patrols.findByRouteParkIdAndStatusOrderByIdAsc(parkId, PatrolStatus.COMPLETED);
        Map<Long, List<GeoUtil.Point>> points = new HashMap<>();
        if (!completed.isEmpty()) {
            tracks.findByPatrolIdInOrderByRecordedAtAscIdAsc(completed.stream().map(patrol -> patrol.getId()).toList())
                    .forEach(point -> points.computeIfAbsent(point.getPatrol().getId(), id -> new ArrayList<>())
                            .add(new GeoUtil.Point(point.getLng(), point.getLat())));
        }
        var response = completed.stream().sorted(Comparator.comparing(com.wildx.wildx.model.Patrol::getScheduledDate).reversed()
                        .thenComparing(com.wildx.wildx.model.Patrol::getId, Comparator.reverseOrder()))
                .map(patrol -> new PatrolHistoryResponse(PatrolResponse.from(patrol),
                        PatrolMetrics.distance(points.getOrDefault(patrol.getId(), List.of())),
                        PatrolMetrics.duration(patrol.getStartedAt(), patrol.getEndedAt()))).toList();
        log.info("patrol history completed parkId={}", parkId);
        return response;
    }
}
