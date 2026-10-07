package com.wildx.wildx.repository;

import com.wildx.wildx.model.Animal;
import org.springframework.data.jpa.repository.*;
import java.util.*;

public interface AnimalRepository extends JpaRepository<Animal, Long> {
    @EntityGraph(attributePaths = "park")
    List<Animal> findByParkIdOrderByNameAscIdAsc(Long parkId);
    @EntityGraph(attributePaths = "park")
    Optional<Animal> findByIdAndParkId(Long id, Long parkId);
}
