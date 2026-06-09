package com.capstone.back.repository;

import com.capstone.back.domain.Interview;
import com.capstone.back.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, String> {
    List<Interview> findByUserOrderByCreatedAtDesc(User user);
}
