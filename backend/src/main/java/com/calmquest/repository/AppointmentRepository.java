package com.calmquest.repository;

import com.calmquest.entity.Appointment;
import com.calmquest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByStudentOrderByAppointmentTimeDesc(User student);
    List<Appointment> findByDoctorOrderByAppointmentTimeDesc(User doctor);
}
