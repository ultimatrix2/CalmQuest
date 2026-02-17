package com.calmquest.dto;

import com.calmquest.entity.CollegeAdmin;
import com.calmquest.entity.Doctor;
import com.calmquest.entity.Student;
import com.calmquest.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDTO {
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String collegeName;
    private Long collegeId;
    private String specialization;
    private String licenseNumber;
    private String communityStatus;
    private String profilePicture;
    private String registrationNumber;
    private String course;
    private String studentYear;

    private String collegeIdNumber; // College Admin

    public static ProfileDTO fromEntity(User user) {
        ProfileDTO.ProfileDTOBuilder builder = ProfileDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .collegeName(user.getCollege() != null ? user.getCollege().getName() : null)
                .collegeId(user.getCollege() != null ? user.getCollege().getId() : null)
                .communityStatus(user.getCommunityStatus().name())
                .profilePicture(user.getProfilePicture());

        if (user instanceof Student student) {
            builder.registrationNumber(student.getRegistrationNumber())
                   .course(student.getCourse())
                   .studentYear(student.getStudentYear());
        } else if (user instanceof Doctor doctor) {
            builder.specialization(doctor.getSpecialization())
                   .licenseNumber(doctor.getLicenseNumber());
        } else if (user instanceof CollegeAdmin admin) {
            builder.collegeIdNumber(admin.getCollegeIdNumber());
        }

        return builder.build();
    }
}
