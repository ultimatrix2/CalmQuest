package com.calmquest.dto;

import com.calmquest.entity.Appointment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AppointmentResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentProfilePicture;
    private Long doctorId;
    private String doctorName;
    private String doctorProfilePicture;
    private LocalDateTime appointmentTime;
    private Appointment.AppointmentStatus status;
    private String reason;
    private String meetingLink;

    public static AppointmentResponse fromEntity(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .studentId(appointment.getStudent().getId())
                .studentName(appointment.getStudent().getFullName())
                .studentEmail(appointment.getStudent().getEmail())
                .studentProfilePicture(appointment.getStudent().getProfilePicture())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getFullName())
                .doctorProfilePicture(appointment.getDoctor().getProfilePicture())
                .appointmentTime(appointment.getAppointmentTime())
                .status(appointment.getStatus())
                .reason(appointment.getReason())
                .meetingLink(appointment.getMeetingLink())
                .build();
    }
}
