package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.service.UserService;
import com.wildx.wildx.type.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final AppUserRepository users;
    private final ParkService parks;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponse> users() {
        log.info("list users started");
        var response = users.findAllByOrderByActiveDescNameAsc().stream().map(AdminUserResponse::from).toList();
        log.info("list users completed count={}", response.size());
        return response;
    }

    @Override
    @Transactional
    public AdminUserResponse createUser(AdminUserRequest request) {
        log.info("create user started role={}", request.role());
        if (isBlank(request.password())) {
            throw new IllegalArgumentException("Password is required");
        }
        AppUser user = new AppUser();
        apply(user, request);
        AdminUserResponse response = AdminUserResponse.from(users.saveAndFlush(user));
        log.info("create user completed userId={}", response.id());
        return response;
    }

    @Override
    @Transactional
    public AdminUserResponse updateUser(Long callerId, Long userId, AdminUserRequest request) {
        log.info("update user started userId={}", userId);
        if (userId.equals(callerId) && (request.role() != Role.ADMIN || !request.active())) {
            throw new IllegalArgumentException("You cannot deactivate or demote yourself");
        }
        AppUser user = requireUser(userId);
        apply(user, request);
        users.flush();
        log.info("update user completed userId={}", userId);
        return AdminUserResponse.from(user);
    }

    @Override
    @Transactional
    public void deactivateUser(Long callerId, Long userId) {
        log.info("deactivate user started userId={}", userId);
        if (userId.equals(callerId)) {
            throw new IllegalArgumentException("You cannot deactivate yourself");
        }
        requireUser(userId).setActive(false);
        log.info("deactivate user completed userId={}", userId);
    }

    private AppUser requireUser(Long userId) {
        return users.findWithParkById(userId).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private void apply(AppUser user, AdminUserRequest request) {
        boolean admin = request.role() == Role.ADMIN;
        if (!admin && request.parkId() == null) {
            throw new IllegalArgumentException("Choose a park for this role");
        }
        if (!isBlank(request.password()) && request.password().length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("Password must have at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        user.setName(request.name().strip());
        user.setEmail(request.email().strip().toLowerCase(Locale.ROOT));
        user.setPhone(isBlank(request.phone()) ? null : request.phone().strip());
        user.setRole(request.role());
        user.setPark(admin ? null : parks.require(request.parkId()));
        user.setActive(request.active());
        if (!isBlank(request.password())) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
