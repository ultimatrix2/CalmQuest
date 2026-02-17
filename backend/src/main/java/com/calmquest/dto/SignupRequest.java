package com.calmquest.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be less than 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must be less than 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 40, message = "Password must be between 8 and 40 characters")
    private String password;

    @NotBlank(message = "Role is required")
    private String role;

    @NotBlank(message = "College Name is required")
    private String collegeName;

    // Role specific optional fields
    private String registrationNumber; // Student
    private String course; // Student
    private String studentYear; // Student

    private String specialization; // Doctor
    private String licenseNumber; // Doctor

    private String collegeIdNumber; // College Admin
}
