package com.wildx.wildx.repository;

import com.wildx.wildx.model.Device;
import org.springframework.data.jpa.repository.*;
import java.util.*;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    @EntityGraph(attributePaths = {"park", "animal"})
    List<Device> findByParkIdOrderByCodeAsc(Long parkId);
    @EntityGraph(attributePaths = {"park", "animal"})
    Optional<Device> findByIdAndParkId(Long id, Long parkId);
    Optional<Device> findByCode(String code);
    List<Device> findByLastSeenAtIsNotNullOrderByIdAsc();
}
