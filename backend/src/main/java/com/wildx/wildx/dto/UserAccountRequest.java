package com.wildx.wildx.dto;

import com.wildx.wildx.type.Role;
import jakarta.validation.constraints.*;

public record UserAccountRequest(@NotBlank @Size(max = 100) String name,
                                 @NotBlank @Email @Size(max = 255) String email,
                                 @Size(max = 30) String phone,
                                 @Size(max = 100) String password,
                                 @NotNull Role role,
                                 @NotNull Boolean active) {}
