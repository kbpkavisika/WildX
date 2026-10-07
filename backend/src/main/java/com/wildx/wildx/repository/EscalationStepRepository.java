package com.wildx.wildx.repository;

import com.wildx.wildx.model.EscalationStep;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EscalationStepRepository extends JpaRepository<EscalationStep, Long> {
    List<EscalationStep> findByParkIdOrderByStepNoAsc(Long parkId);
}
