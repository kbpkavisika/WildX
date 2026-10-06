package com.wildx.wildx.dto;

import com.wildx.wildx.type.Role;

public record UserResponse(Long id, String name, String email, Role role, Long parkId) {
}
