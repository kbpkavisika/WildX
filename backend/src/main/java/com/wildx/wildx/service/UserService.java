package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import java.util.List;

public interface UserService {
    List<AdminUserResponse> users();
    AdminUserResponse createUser(AdminUserRequest request);
    AdminUserResponse updateUser(Long callerId, Long userId, AdminUserRequest request);
    void deactivateUser(Long callerId, Long userId);
}
