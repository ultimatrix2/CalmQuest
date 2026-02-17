package com.calmquest.repository;

import com.calmquest.entity.CollegeAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollegeAdminRepository extends JpaRepository<CollegeAdmin, Long> {
}
