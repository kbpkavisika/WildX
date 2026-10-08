package com.wildx.wildx.repository;

import com.wildx.wildx.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
}
