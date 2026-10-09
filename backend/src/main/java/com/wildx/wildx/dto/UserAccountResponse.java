package com.wildx.wildx.dto;

import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.type.Role;

public record UserAccountResponse(Long id, String name, String email, String phone, Role role,
                                Long parkId, String parkName, boolean active) {
    public static UserAccountResponse from(AppUser user) {
        var park = user.getPark();
        return new UserAccountResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole(),
                park == null ? null : park.getId(), park == null ? null : park.getName(), user.isActive());
    }
}
