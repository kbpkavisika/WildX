package com.wildx.wildx.repository;

import com.wildx.wildx.model.Incident;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    @EntityGraph(attributePaths = {"park", "type", "reporter", "patrol", "sector"})
    List<Incident> findByParkIdOrderByOccurredAtDescIdDesc(Long parkId);
    @EntityGraph(attributePaths = {"park", "type", "reporter", "patrol", "sector"})
    Optional<Incident> findByIdAndParkId(Long id, Long parkId);
}
