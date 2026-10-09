package com.wildx.wildx.repository;

import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.type.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = "park")
    Optional<AppUser> findWithParkById(Long id);

    @Query("select distinct u from AppUser u left join fetch u.park left join u.managedParks p "
            + "where u.park.id = :parkId or p.id = :parkId order by u.active desc, u.name asc")
    List<AppUser> findInPark(Long parkId);

    @Modifying
    @Query(value = "UPDATE app_user SET role = 'MANAGER', active = false WHERE role = 'ADMIN'", nativeQuery = true)
    int retireAdmins();

    @Query("select distinct u from AppUser u left join u.managedParks p "
            + "where u.active = true and u.role = :role and (u.park.id = :parkId or p.id = :parkId) order by u.id")
    List<AppUser> findActiveInPark(Long parkId, Role role);
}
