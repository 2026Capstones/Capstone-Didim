package com.capstone.back.repository;

import com.capstone.back.domain.Interview;
import com.capstone.back.domain.InterviewQa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewQaRepository extends JpaRepository<InterviewQa, String> {
    List<InterviewQa> findByInterviewOrderByOrderNumAsc(Interview interview);
}
