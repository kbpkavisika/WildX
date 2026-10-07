package com.wildx.wildx.repository;

import com.wildx.wildx.model.Sector;
import org.springframework.data.jpa.repository.*;
import java.util.*;

public interface SectorRepository extends JpaRepository<Sector, Long> {
    @EntityGraph(attributePaths = "park")
    List<Sector> findByParkIdOrderByIdAsc(Long parkId);
    @EntityGraph(attributePaths = "park")
    Optional<Sector> findByIdAndParkId(Long id, Long parkId);
}

