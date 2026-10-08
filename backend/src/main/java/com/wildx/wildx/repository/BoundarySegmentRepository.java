package com.wildx.wildx.repository;

import com.wildx.wildx.model.BoundarySegment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoundarySegmentRepository extends JpaRepository<BoundarySegment, Long> {
    @EntityGraph(attributePaths = "park")
    List<BoundarySegment> findByParkIdOrderByNameAscIdAsc(Long parkId);

    @EntityGraph(attributePaths = "park")
    Optional<BoundarySegment> findByIdAndParkId(Long id, Long parkId);

    @EntityGraph(attributePaths = "park")
    Optional<BoundarySegment> findByParkIdAndCodeIgnoreCase(Long parkId, String code);

    boolean existsByParkIdAndCodeIgnoreCase(Long parkId, String code);

    boolean existsByParkIdAndCodeIgnoreCaseAndIdNot(Long parkId, String code, Long id);
}
