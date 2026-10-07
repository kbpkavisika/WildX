package com.wildx.wildx.repository;

import com.wildx.wildx.model.AlertRule;
import com.wildx.wildx.type.ZoneType;
import org.springframework.data.jpa.repository.*;
import java.util.*;

public interface AlertRuleRepository extends JpaRepository<AlertRule, Long> {
    @EntityGraph(attributePaths = "park")
    List<AlertRule> findByParkIdOrderByZoneTypeAsc(Long parkId);
    @EntityGraph(attributePaths = "park")
    Optional<AlertRule> findByParkIdAndZoneType(Long parkId, ZoneType zoneType);
}
