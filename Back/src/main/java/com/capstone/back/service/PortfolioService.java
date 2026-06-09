package com.capstone.back.service;

import com.capstone.back.domain.Portfolio;
import com.capstone.back.domain.User;
import com.capstone.back.repository.PortfolioRepository;
import com.capstone.back.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final LmsMockService lmsMockService;

    @Transactional
    public Portfolio refreshPortfolioFromLms(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LmsMockService.LmsData lmsData = lmsMockService.getMockLmsData(email);

        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElse(Portfolio.builder().user(user).build());

        // 더미 데이터로 포트폴리오 정보 업데이트
        Portfolio updatedPortfolio = Portfolio.builder()
                .portfolioId(portfolio.getPortfolioId())
                .user(user)
                .gpa(lmsData.getGpa())
                .awards(lmsData.getAwards())
                .scholarships(lmsData.getScholarships())
                .volunteer(lmsData.getVolunteer())
                .certifications(lmsData.getCertifications())
                .additionalPdfUrls(portfolio.getAdditionalPdfUrls()) // 데이터 유지
                .build();

        return portfolioRepository.save(updatedPortfolio);
    }

    /**
     * AI로 추출된 데이터를 기존 포트폴리오 데이터와 합칩니다(Merge).
     */
    @Transactional
    public Portfolio updatePortfolioFromAi(String email, PortfolioParsingService.ExtractedPortfolio aiData) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElse(Portfolio.builder().user(user).build());

        // 기존 데이터와 새 데이터를 합치는 로직
        Portfolio updatedPortfolio = Portfolio.builder()
                .portfolioId(portfolio.getPortfolioId())
                .user(user)
                .gpa(aiData.getGpa() != null ? aiData.getGpa() : portfolio.getGpa()) // GPA는 값이 있으면 갱신
                .awards(mergeLists(portfolio.getAwards(), aiData.getAwards()))
                .scholarships(mergeLists(portfolio.getScholarships(), aiData.getScholarships()))
                .volunteer(mergeLists(portfolio.getVolunteer(), aiData.getVolunteer()))
                .certifications(mergeLists(portfolio.getCertifications(), aiData.getCertifications()))
                .additionalPdfUrls(portfolio.getAdditionalPdfUrls()) // 데이터 유지
                .build();

        return portfolioRepository.save(updatedPortfolio);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> mergeLists(Object existing, List<Map<String, Object>> newData) {
        List<Map<String, Object>> merged = new ArrayList<>();
        
        // 1. 기존 데이터 추가
        if (existing instanceof List) {
            merged.addAll((List<Map<String, Object>>) existing);
        }
        
        // 2. 새 데이터 추가 (중복 체크는 생략하거나 필요시 추가)
        if (newData != null) {
            merged.addAll(newData);
        }
        
        return merged;
    }
/**
 * 포트폴리오를 수동으로 업데이트합니다. (수정된 필드만 반영)
 */
@Transactional
public Portfolio updatePortfolio(String email, Portfolio updatedData) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    Portfolio portfolio = portfolioRepository.findByUser(user)
            .orElseThrow(() -> new RuntimeException("Portfolio not found"));

    Portfolio newPortfolio = Portfolio.builder()
            .portfolioId(portfolio.getPortfolioId())
            .user(user)
            // 값이 있으면 수정된 값, 없으면 기존 값 유지
            .gpa(updatedData.getGpa() != null ? updatedData.getGpa() : portfolio.getGpa())
            .awards(updatedData.getAwards() != null ? updatedData.getAwards() : portfolio.getAwards())
            .scholarships(updatedData.getScholarships() != null ? updatedData.getScholarships() : portfolio.getScholarships())
            .volunteer(updatedData.getVolunteer() != null ? updatedData.getVolunteer() : portfolio.getVolunteer())
            .certifications(updatedData.getCertifications() != null ? updatedData.getCertifications() : portfolio.getCertifications())
            .additionalPdfUrls(portfolio.getAdditionalPdfUrls()) // 데이터 유지
            .build();

    return portfolioRepository.save(newPortfolio);
}

/**
 * 사용자의 포트폴리오를 삭제합니다.
 */
@Transactional
public void deletePortfolio(String email) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    Portfolio portfolio = portfolioRepository.findByUser(user)
            .orElseThrow(() -> new RuntimeException("Portfolio not found"));
    portfolioRepository.delete(portfolio);
}

@Transactional
public Portfolio addAdditionalExperience(String email, String fileName, String content) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    Portfolio portfolio = portfolioRepository.findByUser(user)
            .orElse(Portfolio.builder().user(user).build());

    List<Map<String, String>> experiences = new ArrayList<>();
    if (portfolio.getAdditionalPdfUrls() instanceof List) {
        experiences.addAll((List<Map<String, String>>) portfolio.getAdditionalPdfUrls());
    }

    // 새로운 경험 추가 (파일명과 추출된 텍스트 내용)
    Map<String, String> newExp = new java.util.HashMap<>();
    newExp.put("fileName", fileName);
    newExp.put("content", content);
    experiences.add(newExp);

    Portfolio updated = Portfolio.builder()
            .portfolioId(portfolio.getPortfolioId())
            .user(user)
            .gpa(portfolio.getGpa())
            .awards(portfolio.getAwards())
            .scholarships(portfolio.getScholarships())
            .volunteer(portfolio.getVolunteer())
            .certifications(portfolio.getCertifications())
            .additionalPdfUrls(experiences)
            .build();

    return portfolioRepository.save(updated);
}

@Transactional
public Portfolio deleteAdditionalExperience(String email, String fileNameToDelete) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    Portfolio portfolio = portfolioRepository.findByUser(user)
            .orElseThrow(() -> new RuntimeException("Portfolio not found"));

    if (portfolio.getAdditionalPdfUrls() instanceof List) {
        List<Map<String, String>> experiences = new ArrayList<>((List<Map<String, String>>) portfolio.getAdditionalPdfUrls());
        // 파일명 기준으로 삭제
        experiences.removeIf(exp -> fileNameToDelete.equals(exp.get("fileName")));

        Portfolio updated = Portfolio.builder()
                .portfolioId(portfolio.getPortfolioId())
                .user(user)
                .gpa(portfolio.getGpa())
                .awards(portfolio.getAwards())
                .scholarships(portfolio.getScholarships())
                .volunteer(portfolio.getVolunteer())
                .certifications(portfolio.getCertifications())
                .additionalPdfUrls(experiences)
                .build();
        return portfolioRepository.save(updated);
    }
    return portfolio;
}

@Transactional(readOnly = true)
public Portfolio getPortfolioByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return portfolioRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Portfolio not found for this user"));
    }
}
