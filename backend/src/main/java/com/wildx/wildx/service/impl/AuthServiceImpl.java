package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.AuthConstants;
import com.wildx.wildx.dto.LoginRequest;
import com.wildx.wildx.dto.LoginResponse;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.exception.UnauthorizedException;
import com.wildx.wildx.mapper.UserMapper;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import org.springframework.security.oauth2.jwt.Jwt;
import com.wildx.wildx.type.Role;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Duration TOKEN_TTL = Duration.ofHours(12);
    private static final String INVALID_CREDENTIALS = "Invalid email or password";
    private static final String ACCESS_CHANGED = "User access changed; log in again";

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        log.info("login started");
        AppUser user = userRepository.findByEmailIgnoreCase(request.email())
                .filter(AppUser::isActive)
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> {
                    log.warn("login failed");
                    return new UnauthorizedException(INVALID_CREDENTIALS);
                });
        UserResponse userResponse = UserMapper.toResponse(user);
        String token = issueToken(userResponse);
        log.info("login succeeded userId={}", user.getId());
        return new LoginResponse(token, userResponse);
    }

    private String issueToken(UserResponse user) {
        Instant now = Instant.now();
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .subject(user.id().toString())
                .issuedAt(now)
                .expiresAt(now.plus(TOKEN_TTL))
                .claim(AuthConstants.ROLE_CLAIM, user.role().name());
        if (user.parkId() != null) {
            claims.claim(AuthConstants.PARK_ID_CLAIM, user.parkId());
        }
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims.build())).getTokenValue();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse current(Jwt jwt) {
        UserResponse response = UserMapper.toResponse(activeUser(jwt));
        Object parkClaim = jwt.getClaim(AuthConstants.PARK_ID_CLAIM);
        if (response.parkId() == null || parkClaim == null
                || !Objects.equals(response.parkId().toString(), parkClaim.toString())
                || !response.role().name().equals(jwt.getClaimAsString(AuthConstants.ROLE_CLAIM))) {
            throw new UnauthorizedException(ACCESS_CHANGED);
        }
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public void requireParkAccess(Jwt jwt, Long parkId) {
        if (!Role.ADMIN.name().equals(jwt.getClaimAsString(AuthConstants.ROLE_CLAIM))) {
            if (!parkId.equals(current(jwt).parkId())) {
                throw new AccessDeniedException("Access denied");
            }
            return;
        }
        requireAdmin(jwt);
    }

    @Override
    @Transactional(readOnly = true)
    public Long requireAdmin(Jwt jwt) {
        AppUser user = activeUser(jwt);
        if (user.getRole() != Role.ADMIN) {
            throw new UnauthorizedException(ACCESS_CHANGED);
        }
        return user.getId();
    }

    private AppUser activeUser(Jwt jwt) {
        try {
            return userRepository.findWithParkById(Long.valueOf(jwt.getSubject()))
                    .filter(AppUser::isActive).orElseThrow(() -> new UnauthorizedException("User is inactive or missing"));
        } catch (NumberFormatException ex) {
            throw new UnauthorizedException("Invalid user identity");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AppUser requireRanger(Long userId, Long parkId) {
        return userRepository.findWithParkById(userId)
                .filter(AppUser::isActive).filter(user -> user.getRole() == Role.RANGER)
                .filter(user -> user.getPark() != null && user.getPark().getId().equals(parkId))
                .orElseThrow(() -> new IllegalArgumentException("Ranger must be active and assigned to this park"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> activeUserIds(Long parkId, Role role) {
        return userRepository.findByParkIdAndRoleAndActiveTrueOrderByIdAsc(parkId, role).stream()
                .map(AppUser::getId).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> activeUsers(Long parkId, Role role) {
        return userRepository.findByParkIdAndRoleAndActiveTrueOrderByIdAsc(parkId, role).stream()
                .map(UserMapper::toResponse).toList();
    }
}
