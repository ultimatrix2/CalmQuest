package com.calmquest.dto;

import com.calmquest.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String fullName;
    private String email;
    private String role;

    public AuthResponse(String token, User user) {
        this.token = token;
        this.type = "Bearer";
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.role = user.getRole().name();
    }
}
