package com.calmquest.repository;

import com.calmquest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Boolean existsByEmail(String email);

    List<User> findByCollegeAndRole(com.calmquest.entity.College college, com.calmquest.entity.User.Role role);

    List<User> findByCollegeAndCommunityStatus(com.calmquest.entity.College college, com.calmquest.entity.User.CommunityStatus communityStatus);

    List<User> findByFullNameContainingIgnoreCase(String fullName);

    List<User> findByRoleAndCommunityStatus(com.calmquest.entity.User.Role role, com.calmquest.entity.User.CommunityStatus communityStatus);

    List<User> findByRole(com.calmquest.entity.User.Role role);
}
