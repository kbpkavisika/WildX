package com.wildx.wildx.repository;

import com.wildx.wildx.model.IncidentType;
import org.springframework.data.jpa.repository.*;
import java.util.*;

public interface IncidentTypeRepository extends JpaRepository<IncidentType, Long> {
    @EntityGraph(attributePaths = "park")
    List<IncidentType> findByParkIdOrderByNameAscIdAsc(Long parkId);
    @EntityGraph(attributePaths = "park")
    Optional<IncidentType> findByIdAndParkId(Long id, Long parkId);
}
