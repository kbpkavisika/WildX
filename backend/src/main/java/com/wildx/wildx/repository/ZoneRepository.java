package com.wildx.wildx.repository;

import com.wildx.wildx.model.Zone;
import org.springframework.data.jpa.repository.*;
import java.util.*;

public interface ZoneRepository extends JpaRepository<Zone, Long> {
    @EntityGraph(attributePaths = "park")
    List<Zone> findByParkIdOrderByNameAscIdAsc(Long parkId);
    @EntityGraph(attributePaths = "park")
    Optional<Zone> findByIdAndParkId(Long id, Long parkId);
}
