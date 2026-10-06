package com.wildx.wildx.mapper;

import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.model.AppUser;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(AppUser user) {
        Long parkId = user.getPark() == null ? null : user.getPark().getId();
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), parkId);
    }
}
