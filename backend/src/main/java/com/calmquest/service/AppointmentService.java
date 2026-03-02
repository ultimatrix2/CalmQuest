package com.calmquest.service;

import com.calmquest.dto.AppointmentRequest;
import com.calmquest.dto.AppointmentResponse;
import com.calmquest.dto.AppointmentStatusUpdate;
import com.calmquest.entity.Appointment;
import com.calmquest.entity.User;
import com.calmquest.entity.Notification;
import com.calmquest.repository.AppointmentRepository;
import com.calmquest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public AppointmentResponse requestAppointment(User student, AppointmentRequest request) {
        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("Only students can request appointments");
        }

        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (doctor.getRole() != User.Role.DOCTOR) {
            throw new RuntimeException("Invalid doctor");
        }

        if (!student.getCollege().getId().equals(doctor.getCollege().getId())) {
             throw new RuntimeException("Doctor does not belong to your college");
        }

        Appointment appointment = Appointment.builder()
                .student(student)
                .doctor(doctor)
                .college(student.getCollege())
                .reason(request.getReason())
                .appointmentTime(request.getRequestedTime()) // Can be null, doctor schedules it
                .status(Appointment.AppointmentStatus.PENDING)
                .build();

        Appointment savedAppointment = appointmentRepository.save(appointment);

        notificationService.createNotification(
                doctor,
                "New appointment request from " + student.getFullName(),
                Notification.NotificationType.APPOINTMENT, // Or add new type
                "/dashboard/doctor/requests"
        );

        return AppointmentResponse.fromEntity(savedAppointment);
    }

    public List<AppointmentResponse> getStudentAppointments(User student) {
        return appointmentRepository.findByStudentOrderByAppointmentTimeDesc(student)
                .stream().map(AppointmentResponse::fromEntity).collect(Collectors.toList());
    }

    public List<AppointmentResponse> getDoctorAppointments(User doctor) {
        if (doctor.getRole() != User.Role.DOCTOR) {
             throw new RuntimeException("Only doctors can access this");
        }
        return appointmentRepository.findByDoctorOrderByAppointmentTimeDesc(doctor)
                .stream().map(AppointmentResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponse updateAppointmentStatus(Long appointmentId, User doctor, AppointmentStatusUpdate update) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new RuntimeException("Not authorized to update this appointment");
        }

        appointment.setStatus(update.getStatus());
        if (update.getAppointmentTime() != null) {
            appointment.setAppointmentTime(update.getAppointmentTime());
        }
        if (update.getMeetingLink() != null) {
             appointment.setMeetingLink(update.getMeetingLink());
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);

        String message = "Your appointment with Dr. " + doctor.getFullName() + " has been " + update.getStatus();
        if (update.getStatus() == Appointment.AppointmentStatus.CONFIRMED && appointment.getAppointmentTime() != null) {
            message += " scheduled for " + appointment.getAppointmentTime().toString();
        }

        notificationService.createNotification(
                appointment.getStudent(),
                message,
                Notification.NotificationType.SYSTEM,
                "/dashboard/doctor/my-appointments"
        );

        return AppointmentResponse.fromEntity(savedAppointment);
    }
}
