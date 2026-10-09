package com.wildx.wildx.repository;

import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.type.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = "park")
    Optional<AppUser> findWithParkById(Long id);

    @EntityGraph(attributePaths = "park")
    List<AppUser> findAllByOrderByActiveDescNameAsc();

    List<AppUser> findByParkIdAndRoleAndActiveTrueOrderByIdAsc(Long parkId, Role role);
}
