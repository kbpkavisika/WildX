package com.wildx.wildx.repository;

import com.wildx.wildx.model.PatrolRoute;
import org.springframework.data.jpa.repository.*;
import java.util.*;

public interface PatrolRouteRepository extends JpaRepository<PatrolRoute, Long> {
    @EntityGraph(attributePaths = "park")
    List<PatrolRoute> findByParkIdOrderByNameAscIdAsc(Long parkId);
    @EntityGraph(attributePaths = "park")
    Optional<PatrolRoute> findByIdAndParkId(Long id, Long parkId);
}

