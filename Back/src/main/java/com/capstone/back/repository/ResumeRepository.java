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
    // 중복 데이터가 있을 경우 가장 최근 것 하나만 가져옴
    Optional<Resume> findFirstByUserAndJobPostingOrderByCreatedAtDesc(User user, JobPosting jobPosting);

    // 하위 호환성을 위해 기존 메서드 유지 (가장 최근 것 반환)
    default Optional<Resume> findByUserAndJobPosting(User user, JobPosting jobPosting) {
        return findFirstByUserAndJobPostingOrderByCreatedAtDesc(user, jobPosting);
    }
}
