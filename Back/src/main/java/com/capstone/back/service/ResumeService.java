package com.capstone.back.service;

import com.capstone.back.domain.*;
import com.capstone.back.dto.ResumeResponse;
import com.capstone.back.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeService {

    private final AiService aiService;
    private final ResumeRepository resumeRepository;
    private final PortfolioRepository portfolioRepository;
    private final JobPostingRepository jobPostingRepository;
    private final CompanyRepository companyRepository;
    private final MatchResultRepository matchResultRepository;

    /**
     * 학생의 포트폴리오와 매칭 결과를 바탕으로 맞춤형 자기소개서를 생성합니다.
     */
    @Transactional
    public ResumeResponse generateResume(User user, String jobId) {
        // 1. 필수 데이터 조회
        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("포트폴리오 정보가 없습니다."));
        
        JobPosting jobPosting = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("채용 공고 정보가 없습니다."));
        
        MatchResult matchResult = matchResultRepository.findByUserAndJobPosting(user, jobPosting)
                .orElse(null);

        Company company = companyRepository.findByCompanyName(jobPosting.getCompanyName())
                .orElse(null);

        // 2. AI 프롬프트 구성
        String studentData = formatPortfolioData(portfolio);
        String jobInfo = formatJobAndCompanyData(jobPosting, company);
        String matchReason = (matchResult != null) ? matchResult.getReason() : "매칭 분석 결과가 없습니다. 학생의 역량과 공고의 요건을 바탕으로 최선을 다해 작성해주세요.";

        String systemPrompt = """
                당신은 취업 성공률 100%를 자랑하는 전문 자소서 작가입니다.
                제공된 학생의 역량과 기업의 요구사항, 그리고 이미 분석된 매칭 사유를 바탕으로 최적의 자기소개서를 작성하세요.
                
                [작성 가이드라인]
                1. 기업의 인재상과 조직문화에 어울리는 톤앤매너를 유지하세요.
                2. 매칭 분석 결과(Match Reason)에서 언급된 학생의 강점을 극대화하여 기술하세요.
                3. 소제목을 포함하여 가독성 있게 작성하세요.
                4. 지원동기, 직무 역량, 성격의 장단점(직무 연관), 입사 후 포부의 구성을 갖추세요.
                5. 반드시 한국어로 작성하며, 전문적이고 신뢰감 있는 문체를 사용하세요.
                """;

        String content = String.format("""
                ### 1. 학생 역량 데이터:
                %s
                
                ### 2. 채용 공고 및 기업 정보:
                %s
                
                ### 3. AI 매칭 분석 결과 (이 내용을 중심으로 작성):
                %s
                """, studentData, jobInfo, matchReason);

        try {
            log.info("AI 자소서 생성 요청 시작 (User: {}, Job: {})", user.getEmail(), jobPosting.getJobTitle());
            String generatedText = aiService.analyzeContent(content, systemPrompt);

            // 3. 결과 저장 (기존 자소서가 있다면 업데이트, 없으면 생성)
            Resume resume = resumeRepository.findByUserAndJobPosting(user, jobPosting)
                    .map(existing -> Resume.builder()
                            .resumeId(existing.getResumeId())
                            .user(user)
                            .jobPosting(jobPosting)
                            .generatedText(generatedText)
                            .createdAt(existing.getCreatedAt())
                            .build())
                    .orElseGet(() -> Resume.builder()
                            .user(user)
                            .jobPosting(jobPosting)
                            .generatedText(generatedText)
                            .build());

            return ResumeResponse.from(resumeRepository.save(resume));

        } catch (Exception e) {
            log.error("자소서 생성 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException("AI 자소서 생성에 실패했습니다: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<ResumeResponse> getAllResumes(User user) {
        return resumeRepository.findByUser(user).stream()
                .map(ResumeResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResumeResponse getResume(User user, String jobId) {
        JobPosting jobPosting = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("공고를 찾을 수 없습니다."));
        Resume resume = resumeRepository.findByUserAndJobPosting(user, jobPosting)
                .orElseThrow(() -> new RuntimeException("생성된 자소서가 없습니다."));
        return ResumeResponse.from(resume);
    }

    @Transactional
    public ResumeResponse updateResume(User user, String jobId, String newText) {
        JobPosting jobPosting = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("공고를 찾을 수 없습니다."));
        
        Resume resume = resumeRepository.findByUserAndJobPosting(user, jobPosting)
                .orElseThrow(() -> new RuntimeException("수정할 자소서가 없습니다."));

        Resume updatedResume = Resume.builder()
                .resumeId(resume.getResumeId())
                .user(user)
                .jobPosting(jobPosting)
                .generatedText(newText)
                .createdAt(resume.getCreatedAt())
                .build();

        return ResumeResponse.from(resumeRepository.save(updatedResume));
    }

    @Transactional
    public void deleteResume(User user, String jobId) {
        JobPosting jobPosting = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("공고를 찾을 수 없습니다."));
        Resume resume = resumeRepository.findByUserAndJobPosting(user, jobPosting)
                .orElseThrow(() -> new RuntimeException("삭제할 자소서가 없습니다."));
        resumeRepository.delete(resume);
    }

    @SuppressWarnings("unchecked")
    private String formatPortfolioData(Portfolio p) {
        String base = String.format("GPA: %s\n수상: %s\n장학금: %s\n봉사: %s\n자격증: %s",
                p.getGpa(), p.getAwards(), p.getScholarships(), p.getVolunteer(), p.getCertifications());

        if (p.getAdditionalPdfUrls() instanceof List) {
            List<Map<String, String>> experiences = (List<Map<String, String>>) p.getAdditionalPdfUrls();
            if (!experiences.isEmpty()) {
                StringBuilder expBuilder = new StringBuilder();
                expBuilder.append("\n\n[추가 경험 상세 자료 (사용자 업로드 PDF 기반)]:");
                for (Map<String, String> exp : experiences) {
                    expBuilder.append("\n- 파일명: ").append(exp.get("fileName"));
                    expBuilder.append("\n- 내용 추출: ").append(exp.get("content"));
                    expBuilder.append("\n---");
                }
                expBuilder.append("\n위의 추가 경험들은 학생이 정규 과정 외에 직접 수행한 프로젝트나 대회 성과들입니다. 이 내용들을 반드시 분석하여 자소서의 '직무 역량'과 '경험' 섹션에 핵심 근거로 활용해 주세요. 단순히 나열하지 말고, 해당 기업의 직무 요구사항과 가장 잘 연결되는 부분을 강조하여 작성하세요.");
                base += expBuilder.toString();
            }
        }
        return base;
    }

    private String formatJobAndCompanyData(JobPosting j, Company c) {
        String companyDetail = (c != null) ? 
                String.format("인재상: %s\n문화: %s\n우대역량: %s", c.getTalentType(), c.getCulture(), c.getPreferred_skills()) : 
                "상세 정보 없음";
        
        return String.format("회사: %s\n직무: %s\n자격요건: %s\n상세설명: %s\n%s",
                j.getCompanyName(), j.getJobTitle(), j.getRequirements(), j.getDescription(), companyDetail);
    }
}
