package com.capstone.back.repository;

import com.capstone.back.domain.Portfolio;
import com.capstone.back.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, String> {
    Optional<Portfolio> findByUser(User user);
}
