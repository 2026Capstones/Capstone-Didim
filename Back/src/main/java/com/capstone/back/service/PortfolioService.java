package com.capstone.back.service;

import com.capstone.back.domain.Portfolio;
import com.capstone.back.domain.User;
import com.capstone.back.repository.PortfolioRepository;
import com.capstone.back.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
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
                .orElseGet(() -> portfolioRepository.save(Portfolio.builder().user(user).build()));

        // 기존 데이터와 LMS 데이터를 병합하여 덮어쓰기 방지
        java.math.BigDecimal finalGpa = (lmsData.getGpa() != null) ? lmsData.getGpa() : portfolio.getGpa();
        Object mergedAwards = mergeLists(portfolio.getAwards(), lmsData.getAwards());
        Object mergedScholarships = mergeLists(portfolio.getScholarships(), lmsData.getScholarships());
        Object mergedVolunteer = mergeLists(portfolio.getVolunteer(), lmsData.getVolunteer());
        Object mergedCertifications = mergeLists(portfolio.getCertifications(), lmsData.getCertifications());
        Object mergedProjects = mergeLists(portfolio.getProjects(), lmsData.getProjects());

        // 더미 데이터로 포트폴리오 정보 업데이트 (Dirty Checking)
        portfolio.updateData(
                finalGpa,
                mergedAwards,
                mergedScholarships,
                mergedVolunteer,
                mergedCertifications,
                mergedProjects
        );

        return portfolio;
    }

    /**
     * AI로 추출된 데이터를 기존 포트폴리오 데이터와 합칩니다(Merge).
     */
    @Transactional
    public Portfolio updatePortfolioFromAi(String email, PortfolioParsingService.ExtractedPortfolio aiData) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseGet(() -> {
                    Portfolio newPortfolio = Portfolio.builder().user(user).build();
                    return portfolioRepository.save(newPortfolio);
                });

        // 1. 기존 데이터와 합치기
        java.math.BigDecimal finalGpa = (aiData.getGpa() != null) ? aiData.getGpa() : portfolio.getGpa();
        Object mergedAwards = mergeLists(portfolio.getAwards(), aiData.getAwards());
        Object mergedScholarships = mergeLists(portfolio.getScholarships(), aiData.getScholarships());
        Object mergedVolunteer = mergeLists(portfolio.getVolunteer(), aiData.getVolunteer());
        Object mergedCertifications = mergeLists(portfolio.getCertifications(), aiData.getCertifications());
        Object mergedProjects = mergeLists(portfolio.getProjects(), aiData.getProjects());

        // 2. 기존 영속성 컨텍스트 내의 엔티티 필드 직접 수정 (Dirty Checking)
        portfolio.updateData(
                finalGpa,
                mergedAwards,
                mergedScholarships,
                mergedVolunteer,
                mergedCertifications,
                mergedProjects
        );

        log.info("AI 분석 결과 반영 완료 (JPA Dirty Checking): User={}, PortfolioID={}", email, portfolio.getPortfolioId());
        // @Transactional이 걸려있으므로 save()를 호출하지 않아도 메서드 종료 시 DB에 반영됨
        return portfolio;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> mergeLists(Object existing, List<Map<String, Object>> newData) {
        List<Map<String, Object>> merged = new ArrayList<>();
        
        // 1. 기존 데이터 추가
        if (existing instanceof List) {
            merged.addAll((List<Map<String, Object>>) existing);
        }
        
        // 2. 새 데이터 추가 (중복 방지: 이름/제목 기준)
        if (newData != null) {
            for (Map<String, Object> newItem : newData) {
                boolean exists = merged.stream().anyMatch(oldItem -> {
                    String newName = String.valueOf(newItem.get("name") != null ? newItem.get("name") : newItem.get("title") != null ? newItem.get("title") : newItem.get("org"));
                    String oldName = String.valueOf(oldItem.get("name") != null ? oldItem.get("name") : oldItem.get("title") != null ? oldItem.get("title") : oldItem.get("org"));
                    return newName.equals(oldName);
                });
                if (!exists) {
                    merged.add(newItem);
                }
            }
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

        // 값이 있으면 수정된 값, 없으면 기존 값 유지 (Dirty Checking)
        java.math.BigDecimal finalGpa = (updatedData.getGpa() != null) ? updatedData.getGpa() : portfolio.getGpa();
        Object finalAwards = (updatedData.getAwards() != null) ? updatedData.getAwards() : portfolio.getAwards();
        Object finalScholarships = (updatedData.getScholarships() != null) ? updatedData.getScholarships() : portfolio.getScholarships();
        Object finalVolunteer = (updatedData.getVolunteer() != null) ? updatedData.getVolunteer() : portfolio.getVolunteer();
        Object finalCertifications = (updatedData.getCertifications() != null) ? updatedData.getCertifications() : portfolio.getCertifications();
        Object finalProjects = (updatedData.getProjects() != null) ? updatedData.getProjects() : portfolio.getProjects();

        portfolio.updateData(
                finalGpa,
                finalAwards,
                finalScholarships,
                finalVolunteer,
                finalCertifications,
                finalProjects
        );

        return portfolio;
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
            .orElseGet(() -> portfolioRepository.save(Portfolio.builder().user(user).build()));

    List<Map<String, String>> experiences = new ArrayList<>();
    if (portfolio.getAdditionalPdfUrls() instanceof List) {
        experiences.addAll((List<Map<String, String>>) portfolio.getAdditionalPdfUrls());
    }

    // 새로운 경험 추가 (파일명과 추출된 텍스트 내용)
    Map<String, String> newExp = new java.util.HashMap<>();
    newExp.put("fileName", fileName);
    newExp.put("content", content);
    experiences.add(newExp);

    portfolio.updateAdditionalPdfs(experiences);
    return portfolio;
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
        portfolio.updateAdditionalPdfs(experiences);
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
