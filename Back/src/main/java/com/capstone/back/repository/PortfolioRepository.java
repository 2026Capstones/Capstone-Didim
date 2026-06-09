package com.capstone.back.repository;

import com.capstone.back.domain.Portfolio;
import com.capstone.back.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, String> {
    // 중복 데이터가 있을 경우 가장 최근 수정된 것 하나만 가져옴
    Optional<Portfolio> findFirstByUserOrderByUpdatedAtDesc(User user);

    // 하위 호환성을 위해 기존 메서드 유지 (가장 최근 것 반환)
    default Optional<Portfolio> findByUser(User user) {
        return findFirstByUserOrderByUpdatedAtDesc(user);
    }
}
