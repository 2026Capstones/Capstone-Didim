package com.capstone.back.repository;

import com.capstone.back.domain.JobPosting;
import com.capstone.back.domain.Resume;
import com.capstone.back.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, String> {
    List<Resume> findByUser(User user);
    Optional<Resume> findByUserAndJobPosting(User user, JobPosting jobPosting);
}
