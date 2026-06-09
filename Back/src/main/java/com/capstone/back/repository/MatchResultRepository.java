package com.capstone.back.repository;

import com.capstone.back.domain.JobPosting;
import com.capstone.back.domain.MatchResult;
import com.capstone.back.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchResultRepository extends JpaRepository<MatchResult, String> {
    List<MatchResult> findByUserOrderByMatchScoreDesc(User user);
    Optional<MatchResult> findByUserAndJobPosting(User user, JobPosting jobPosting);
}
