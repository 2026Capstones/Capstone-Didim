package com.capstone.back.service;

import com.capstone.back.domain.*;
import com.capstone.back.repository.CompanyRepository;
import com.capstone.back.repository.JobPostingRepository;
import com.capstone.back.repository.MatchResultRepository;
import com.capstone.back.repository.PortfolioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchService {

    private final AiService aiService;
    private final MatchResultRepository matchResultRepository;
    private final PortfolioRepository portfolioRepository;
    private final JobPostingRepository jobPostingRepository;
    private final CompanyRepository companyRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 사용자의 포트폴리오와 특정 채용 공고를 비교하여 매칭 점수를 계산합니다.
     */
    @Transactional
    public MatchResult calculateMatch(User user, String jobId) {
        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("사용자의 포트폴리오를 찾을 수 없습니다."));
        
        JobPosting jobPosting = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("해당 채용 공고를 찾을 수 없습니다."));

        // AI에게 전달할 컨텐츠 구성
        String studentData = formatStudentData(portfolio);
        String jobData = formatJobData(jobPosting);

        String systemPrompt = """
                당신은 전문 채용 컨설턴트입니다. 
                제공된 학생의 포트폴리오 데이터와 기업의 채용 공고 데이터를 정밀하게 비교하여 매칭 점수를 산출하세요.
                
                [주의 사항]
                1. 점수는 0점에서 100점 사이의 정수로 산출하세요.
                2. 매칭 사유(reason)는 해당 직무 역량, 기술 스택, 프로젝트 경험, 인재상 부합 여부를 근거로 한국어로 상세히 작성하세요.
                3. 반드시 아래의 JSON 형식으로만 응답하세요. 다른 설명은 생략하세요.
                
                {
                  "score": 85,
                  "reason": "학생의 Java 및 Spring Boot 숙련도가 공고의 자격 요건과 매우 잘 일치하며, 관련 프로젝트 경험이 풍부합니다..."
                }
                """;

        String content = String.format("### 학생 데이터:\n%s\n\n### 채용 공고 데이터:\n%s", studentData, jobData);
        
        try {
            String aiResponse = aiService.analyzeContent(content, systemPrompt);
            // JSON 응답에서 불필요한 마크다운 제거
            aiResponse = aiResponse.replaceAll("```json|```", "").trim();
            
            Map<String, Object> resultMap = objectMapper.readValue(aiResponse, Map.class);
            // Jackson은 기본적으로 정수를 Integer로 파싱하지만, 안전을 위해 처리를 강화합니다.
            Object scoreObj = resultMap.get("score");
            int score = (scoreObj instanceof Number) ? ((Number) scoreObj).intValue() : 0;
            String reason = (String) resultMap.get("reason");

            // 기존 결과가 있으면 업데이트, 없으면 신규 생성
            MatchResult matchResult = matchResultRepository.findByUserAndJobPosting(user, jobPosting)
                    .map(existing -> MatchResult.builder()
                                .matchId(existing.getMatchId())
                                .user(user)
                                .jobPosting(jobPosting)
                                .matchScore(new BigDecimal(score))
                                .reason(reason)
                                .createdAt(existing.getCreatedAt())
                                .build())
                    .orElseGet(() -> MatchResult.builder()
                            .user(user)
                            .jobPosting(jobPosting)
                            .matchScore(new BigDecimal(score))
                            .reason(reason)
                            .build());

            return matchResultRepository.save(matchResult);

        } catch (Exception e) {
            log.error("매칭 계산 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException("AI 매칭 분석에 실패했습니다: " + e.getMessage());
        }
    }

    private String formatStudentData(Portfolio portfolio) {
        return String.format("GPA: %s\n수상 경력: %s\n장학금: %s\n봉사활동: %s\n자격증: %s",
                portfolio.getGpa(), portfolio.getAwards(), 
                portfolio.getScholarships(), portfolio.getVolunteer(), 
                portfolio.getCertifications());
    }

    private String formatJobData(JobPosting job) {
        // 회사 이름으로 회사 정보 조회
        Company company = companyRepository.findByCompanyName(job.getCompanyName())
                .orElse(null);
        
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("회사명: %s\n공고명: %s\n자격요건: %s\n상세설명: %s\n",
                job.getCompanyName(), job.getJobTitle(), job.getRequirements(), job.getDescription()));

        if (company != null) {
            sb.append(String.format("인재상: %s\n조직문화: %s\n우대기술: %s", 
                    company.getTalentType(), company.getCulture(), company.getPreferred_skills()));
        } else {
            sb.append("기업 상세 정보: 현재 등록된 정보 없음");
        }

        return sb.toString();
    }
}
