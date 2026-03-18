package com.calmquest.repository;

import com.calmquest.entity.CollegeAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.calmquest.entity.College;
import java.util.List;

@Repository
public interface CollegeAdminRepository extends JpaRepository<CollegeAdmin, Long> {
    List<CollegeAdmin> findByCollege(College college);
}
