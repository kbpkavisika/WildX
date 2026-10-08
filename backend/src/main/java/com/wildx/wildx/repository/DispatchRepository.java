package com.wildx.wildx.repository;

import com.wildx.wildx.model.Dispatch;
import com.wildx.wildx.type.DispatchStatus;
import com.wildx.wildx.type.SourceType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DispatchRepository extends JpaRepository<Dispatch, Long> {

    @EntityGraph(attributePaths = {"responder", "assignedBy"})
    Optional<Dispatch> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"responder", "assignedBy"})
    List<Dispatch> findByResponderIdOrderByAssignedAtDesc(Long responderId);

    @EntityGraph(attributePaths = {"responder", "assignedBy"})
    List<Dispatch> findBySourceTypeAndSourceIdOrderByAssignedAtDesc(SourceType sourceType, Long sourceId);

    boolean existsBySourceTypeAndSourceIdAndResponderId(SourceType sourceType, Long sourceId, Long responderId);

    Optional<Dispatch> findFirstBySourceTypeAndSourceIdAndStatusInOrderByAssignedAtDesc(
            SourceType sourceType,
            Long sourceId,
            Collection<DispatchStatus> statuses
    );
}
