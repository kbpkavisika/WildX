package com.wildx.wildx.repository;

import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.type.CommunityReportStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommunityReportRepository extends JpaRepository<CommunityReport, Long> {
    @EntityGraph(attributePaths = {"park", "segment", "duplicateOf"})
    Optional<CommunityReport> findByReferenceCode(String referenceCode);

    @EntityGraph(attributePaths = {"park", "segment", "duplicateOf"})
    Optional<CommunityReport> findByIdAndParkId(Long id, Long parkId);

    @EntityGraph(attributePaths = {"park", "segment"})
    List<CommunityReport> findByParkIdOrderByCreatedAtDescIdDesc(Long parkId);

    @EntityGraph(attributePaths = {"park", "segment"})
    List<CommunityReport> findByParkIdAndStatusOrderByCreatedAtDescIdDesc(Long parkId, CommunityReportStatus status);

    @EntityGraph(attributePaths = {"park", "segment"})
    Optional<CommunityReport> findFirstByParkIdAndSegmentIdAndStatusNotInAndCreatedAtAfterOrderByCreatedAtDesc(
            Long parkId,
            Long segmentId,
            Collection<CommunityReportStatus> excludedStatuses,
            Instant after
    );

    Optional<CommunityReport> findTopByOrderByIdDesc();
}
