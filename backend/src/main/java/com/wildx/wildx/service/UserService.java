package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import java.util.List;

public interface UserService {
    List<UserAccountResponse> users(Long parkId);
    UserAccountResponse createUser(Long parkId, UserAccountRequest request);
    UserAccountResponse updateUser(UserResponse caller, Long userId, UserAccountRequest request);
    void deactivateUser(UserResponse caller, Long userId);
    List<ParkResponse> parks(Long userId);
    ParkResponse createPark(Long userId, ParkRequest request);
    UserResponse switchPark(Long userId, Long parkId);
}
