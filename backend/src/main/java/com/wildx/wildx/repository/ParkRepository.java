package com.wildx.wildx.repository;

import com.wildx.wildx.model.Park;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParkRepository extends JpaRepository<Park, Long> {

    List<Park> findAllByOrderByNameAsc();
}
