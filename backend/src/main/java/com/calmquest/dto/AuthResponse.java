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
    @Builder.Default
    private String type = "Bearer";
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String collegeName;
    private String profilePicture;
    private String communityStatus;
    @Builder.Default
    private boolean emailVerificationRequired = false;

    public AuthResponse(String token, User user) {
        this.token = token;
        this.type = "Bearer";
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.role = user.getRole().name();
        this.collegeName = user.getCollege() != null ? user.getCollege().getName() : null;
        this.profilePicture = user.getProfilePicture();
        this.communityStatus = user.getCommunityStatus() != null ? user.getCommunityStatus().name() : null;
    }
}
