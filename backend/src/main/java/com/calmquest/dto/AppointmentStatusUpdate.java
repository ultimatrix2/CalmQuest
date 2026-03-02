package com.calmquest.dto;

import com.calmquest.entity.Appointment;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AppointmentStatusUpdate {
    private Appointment.AppointmentStatus status;
    private LocalDateTime appointmentTime;
    private String meetingLink;
}
