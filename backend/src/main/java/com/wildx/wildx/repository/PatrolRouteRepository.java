package com.wildx.wildx.repository;

import com.wildx.wildx.model.PatrolRoute;
import org.springframework.data.jpa.repository.*;
import java.util.*;

public interface PatrolRouteRepository extends JpaRepository<PatrolRoute, Long> {
    @EntityGraph(attributePaths = "park")
    List<PatrolRoute> findByParkIdAndArchivedFalseOrderByNameAscIdAsc(Long parkId);
    @EntityGraph(attributePaths = "park")
    Optional<PatrolRoute> findByIdAndParkIdAndArchivedFalse(Long id, Long parkId);
}
