package com.calmquest.service;

import com.calmquest.entity.*;
import com.calmquest.repository.CollegeAdminRepository;
import com.calmquest.repository.DoctorRepository;
import com.calmquest.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SosService {

    private final DoctorRepository doctorRepository;
    private final CollegeAdminRepository collegeAdminRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    /**
     * Triggers an emergency SOS alert for the given student.
     * Finds all doctors and college admins for the student's college,
     * sends them an email, and creates an in-app system notification.
     */
    @Transactional
    public void triggerSos(User student) {
        if (student == null || student.getCollege() == null) {
            log.error("Failed to trigger SOS: Student or student's college is null");
            throw new RuntimeException("Cannot trigger SOS: College information is missing.");
        }

        College college = student.getCollege();
        String studentName = student.getFullName();
        String studentEmail = student.getEmail();
        String collegeName = college.getName();

        log.info("SOS triggered by student: {} ({}) for college: {}", studentName, studentEmail, collegeName);

        // Fetch contacts
        List<Doctor> doctors = doctorRepository.findByCollege(college);
        List<CollegeAdmin> admins = collegeAdminRepository.findByCollege(college);

        if (doctors.isEmpty() && admins.isEmpty()) {
            log.warn("No doctors or admins found for college: {}", collegeName);
            // Optionally, we could send to a super admin here
        }

        String alertMessage = "🚨 URGENT: Emergency SOS triggered by student " + studentName + ". Immediate action required.";

        // Alert Doctors
        for (Doctor doctor : doctors) {
            sendAlert(doctor, studentName, studentEmail, collegeName, alertMessage);
        }

        // Alert College Admins
        for (CollegeAdmin admin : admins) {
            sendAlert(admin, studentName, studentEmail, collegeName, alertMessage);
        }
        
        // Alert dedicated emergency email
        if (college.getEmergencyEmail() != null && !college.getEmergencyEmail().isBlank()) {
            try {
                emailService.sendEmergencySosEmail(college.getEmergencyEmail(), studentName, studentEmail, collegeName);
                log.info("Sent SOS alert to college emergency email: {}", college.getEmergencyEmail());
            } catch (Exception e) {
                log.error("Failed to send SOS alert to Emergency Email {}: {}", college.getEmergencyEmail(), e.getMessage());
            }
        }
        
        log.info("SOS alerts generated successfully.");
    }

    private void sendAlert(User recipient, String studentName, String studentEmail, String collegeName, String alertMessage) {
        try {
            // 1. Create In-App Notification
            Notification notification = Notification.builder()
                    .recipient(recipient)
                    .message(alertMessage)
                    .type(Notification.NotificationType.SYSTEM)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);

            // 2. Send Emergency Email
            emailService.sendEmergencySosEmail(recipient.getEmail(), studentName, studentEmail, collegeName);
        } catch (Exception e) {
            log.error("Failed to send SOS alert to {}: {}", recipient.getEmail(), e.getMessage());
        }
    }
}
