package com.capstone.back.service;

import com.capstone.back.domain.*;
import com.capstone.back.dto.InterviewResponse;
import com.capstone.back.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewService {

    private final AiService aiService;
    private final InterviewRepository interviewRepository;
    private final InterviewQaRepository interviewQaRepository;
    private final JobPostingRepository jobPostingRepository;
    private final PortfolioRepository portfolioRepository;
    private final ResumeRepository resumeRepository;
    private final CompanyRepository companyRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    /**
     * 면접 세션을 시작하고 첫 번째 질문을 생성합니다.
     */
    @Transactional
    public InterviewResponse startInterview(User user, String jobId, String type) {
        // 1. 데이터 준비
        JobPosting jobPosting = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("채용 공고를 찾을 수 없습니다."));
        
        Portfolio portfolio = portfolioRepository.findFirstByUserOrderByUpdatedAtDesc(user)
                .orElseThrow(() -> new RuntimeException("포트폴리오가 없습니다."));

        Company company = companyRepository.findByCompanyName(jobPosting.getCompanyName())
                .orElse(null);

        Resume resume = resumeRepository.findFirstByUserAndJobPostingOrderByCreatedAtDesc(user, jobPosting).orElse(null);

        // 면접 유형 매핑 보완 (입력값이 'personalityinterviewer' 등으로 올 경우 처리)
        Interview.InterviewType interviewType;
        String lowercaseType = type.toLowerCase();
        if (lowercaseType.contains("personality")) {
            interviewType = Interview.InterviewType.personality;
        } else if (lowercaseType.contains("technical")) {
            interviewType = Interview.InterviewType.technical;
        } else if (lowercaseType.contains("pt")) {
            interviewType = Interview.InterviewType.pt;
        } else {
            throw new RuntimeException("올바르지 않은 면접 유형입니다: " + type);
        }

        // 2. 면접 세션 생성
        Interview interview = Interview.builder()
                .user(user)
                .jobPosting(jobPosting)
                .jobType(jobPosting.getJobTitle())
                .interviewType(interviewType)
                .status(Interview.InterviewStatus.START)
                .qaList(new ArrayList<>())
                .build();
        
        Interview savedInterview = interviewRepository.save(interview);

        // 3. AI 페르소나 기반 첫 질문 생성
        String firstQuestion = generateQuestion(savedInterview, portfolio, resume, jobPosting, company, null);

        // 4. 질문 저장
        InterviewQa qa = InterviewQa.builder()
                .interview(savedInterview)
                .questionType(InterviewQa.QuestionType.ai)
                .question(firstQuestion)
                .orderNum(1)
                .build();
        
        interviewQaRepository.save(qa);
        savedInterview.getQaList().add(qa);
        savedInterview.updateStatus(Interview.InterviewStatus.IN_PROGRESS);

        return InterviewResponse.from(savedInterview);
    }

    /**
     * 답변 제출 및 다음 질문 받기 (FastAPI 연동)
     */
    @Transactional
    public InterviewResponse submitAnswer(User user, String interviewId, 
                                         org.springframework.web.multipart.MultipartFile audioFile, 
                                         org.springframework.web.multipart.MultipartFile videoFile) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("면접 세션을 찾을 수 없습니다."));

        if (!interview.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("본인의 면접만 진행할 수 있습니다.");
        }

        InterviewQa currentQa = interview.getQaList().stream()
                .filter(q -> q.getAnswer() == null)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("답변할 질문이 없습니다."));

        Portfolio portfolio = portfolioRepository.findByUser(user).orElse(null);
        Resume resume = resumeRepository.findByUserAndJobPosting(user, interview.getJobPosting()).orElse(null);
        Company company = companyRepository.findByCompanyName(interview.getJobPosting().getCompanyName()).orElse(null);

        // 1. AI 서버용 컨텍스트 데이터 구성
        Map<String, String> contextMap = new HashMap<>();
        contextMap.put("interview_type", interview.getInterviewType().name());
        contextMap.put("current_question", currentQa.getQuestion());
        contextMap.put("student_portfolio", formatPortfolio(portfolio) + "\n" + (resume != null ? resume.getGeneratedText() : ""));
        contextMap.put("company_info", (company != null ? (company.getTalentType() + " / " + company.getCulture()) : "일반 기업"));

        String contextData;
        try {
            contextData = objectMapper.writeValueAsString(contextMap);
        } catch (Exception e) {
            throw new RuntimeException("컨텍스트 데이터 생성 실패");
        }

        // 2. AI 서버 분석 요청
        Map<String, Object> aiResult = aiService.analyzeInterview(videoFile, audioFile, contextData);
        
        try {
            String studentAnswer = (String) aiResult.get("student_answer");
            Map<String, Object> llmFeedback = (Map<String, Object>) aiResult.get("llm_feedback");
            
            String feedback = (String) llmFeedback.get("feedback");
            int score = (llmFeedback.get("score") instanceof Number) ? ((Number) llmFeedback.get("score")).intValue() : 0;
            String nextQuestion = (String) llmFeedback.get("next_question");

            // 현재 QA 업데이트 (JPA Dirty Checking 활용)
            currentQa.evaluate(studentAnswer, feedback, score);
            interviewQaRepository.save(currentQa);

            // 다음 질문 생성 (마지막 질문이 아닌 경우)
            if (nextQuestion != null && !nextQuestion.isBlank() && interview.getQaList().size() < 5) {
                InterviewQa nextQa = InterviewQa.builder()
                        .interview(interview)
                        .questionType(InterviewQa.QuestionType.ai)
                        .question(nextQuestion)
                        .orderNum(currentQa.getOrderNum() + 1)
                        .build();
                interviewQaRepository.save(nextQa);
                interview.getQaList().add(nextQa);
            } else {
                // 면접 종료 처리
                double avg = interview.getQaList().stream()
                        .filter(q -> q.getScore() != null)
                        .mapToInt(InterviewQa::getScore)
                        .average().orElse(0);
                interview.completeInterview((int)avg, "전체 면접이 종료되었습니다. 각 문항의 피드백을 확인해주세요.");
            }

            return InterviewResponse.from(interviewRepository.save(interview));
        } catch (Exception e) {
            log.error("AI 분석 결과 처리 중 오류: {}", e.getMessage());
            throw new RuntimeException("AI 결과 처리 실패: " + e.getMessage());
        }
    }

    /**
     * 답변 제출 및 다음 질문 받기 (기존 텍스트 방식 - 하위 호환성 유지 필요 시)
     */
    @Transactional
    public InterviewResponse submitAnswer(User user, String interviewId, String answer) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("면접 세션을 찾을 수 없습니다."));

        if (!interview.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("본인의 면접만 진행할 수 있습니다.");
        }

        List<InterviewQa> qaList = interviewQaRepository.findByInterviewOrderByOrderNumAsc(interview);
        InterviewQa currentQa = qaList.stream()
                .filter(qa -> qa.getAnswer() == null)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("답변할 질문이 없습니다."));

        if (qaList.size() >= 5) {
            return finishInterview(interview, currentQa, answer);
        }

        return processAiFeedbackAndNextQuestion(interview, currentQa, answer);
    }

    private InterviewResponse processAiFeedbackAndNextQuestion(Interview interview, InterviewQa currentQa, String answer) {
        Portfolio portfolio = portfolioRepository.findByUser(interview.getUser()).orElse(null);
        Resume resume = resumeRepository.findByUserAndJobPosting(interview.getUser(), interview.getJobPosting()).orElse(null);
        Company company = companyRepository.findByCompanyName(interview.getJobPosting().getCompanyName()).orElse(null);

        String persona = getPersona(interview.getInterviewType());
        
        String systemPrompt = String.format("""
                %s
                
                [면접 환경] 회사: %s, 직무: %s
                [지원자 데이터] 스펙: %s, 자소서: %s
                
                당신은 전문 면접관입니다. 지원자의 답변을 평가하고 피드백을 준 뒤, 다음 질문을 던지세요.
                
                [주의 사항]
                1. 반드시 지원자의 '포트폴리오'와 '자소서'에 기재된 구체적인 경험을 근거로 질문하십시오.
                2. 지원자의 답변에서 부족한 점을 날카롭게 파고드는 꼬리 질문을 던지거나, 새로운 직무 역량 검증 질문을 하십시오.
                3. 피드백은 한국어로 전문적이고 건설적으로 작성하십시오.
                4. 점수는 0~100점 사이로 산출하십시오.
                5. 반드시 아래의 JSON 형식으로만 응답하십시오.
                
                {
                  "feedback": "...",
                  "score": 85,
                  "nextQuestion": "..."
                }
                """, persona, interview.getJobPosting().getCompanyName(), interview.getJobPosting().getJobTitle(),
                formatPortfolio(portfolio), (resume != null ? resume.getGeneratedText() : "없음"));

        String content = String.format("질문: %s\n지원자 답변: %s", currentQa.getQuestion(), answer);
        
        try {
            String aiResponse = aiService.analyzeContent(content, systemPrompt);
            aiResponse = aiResponse.replaceAll("```json|```", "").trim();
            
            java.util.Map<String, Object> resultMap = objectMapper.readValue(aiResponse, java.util.Map.class);
            String feedback = (String) resultMap.get("feedback");
            int score = (int) resultMap.get("score");
            String nextQuestion = (String) resultMap.get("nextQuestion");

            // 현재 QA 업데이트
            InterviewQa evaluatedQa = InterviewQa.builder()
                    .qaId(currentQa.getQaId())
                    .interview(interview)
                    .questionType(currentQa.getQuestionType())
                    .question(currentQa.getQuestion())
                    .answer(answer)
                    .feedback(feedback)
                    .score(score)
                    .orderNum(currentQa.getOrderNum())
                    .build();
            interviewQaRepository.save(evaluatedQa);

            // 다음 질문 생성
            InterviewQa nextQa = InterviewQa.builder()
                    .interview(interview)
                    .questionType(InterviewQa.QuestionType.ai)
                    .question(nextQuestion)
                    .orderNum(currentQa.getOrderNum() + 1)
                    .build();
            interviewQaRepository.save(nextQa);
            
            interview.getQaList().removeIf(q -> q.getQaId().equals(currentQa.getQaId()));
            interview.getQaList().add(evaluatedQa);
            interview.getQaList().add(nextQa);

            return InterviewResponse.from(interview);
        } catch (Exception e) {
            log.error("답변 처리 중 오류: {}", e.getMessage());
            throw new RuntimeException("AI 분석 실패");
        }
    }

    private InterviewResponse finishInterview(Interview interview, InterviewQa lastQa, String answer) {
        String persona = getPersona(interview.getInterviewType());
        
        String systemPrompt = String.format("""
                %s
                마지막 답변을 평가하고 전체 면접에 대한 총평을 작성하십시오.
                반드시 JSON 형식으로 응답하십시오.
                { "feedback": "마지막 답변 피드백", "score": 80, "overall": "전체 총평" }
                """, persona);

        String content = String.format("마지막 질문: %s\n지원자 답변: %s", lastQa.getQuestion(), answer);
        
        try {
            String aiResponse = aiService.analyzeContent(content, systemPrompt);
            aiResponse = aiResponse.replaceAll("```json|```", "").trim();
            java.util.Map<String, Object> resultMap = objectMapper.readValue(aiResponse, java.util.Map.class);
            
            InterviewQa finalQa = InterviewQa.builder()
                    .qaId(lastQa.getQaId())
                    .interview(interview)
                    .questionType(lastQa.getQuestionType())
                    .question(lastQa.getQuestion())
                    .answer(answer)
                    .feedback((String) resultMap.get("feedback"))
                    .score((int) resultMap.get("score"))
                    .orderNum(lastQa.getOrderNum())
                    .build();
            interviewQaRepository.save(finalQa);

            List<InterviewQa> allQa = interviewQaRepository.findByInterviewOrderByOrderNumAsc(interview);
            double avg = allQa.stream().filter(q -> q.getScore() != null).mapToInt(InterviewQa::getScore).average().orElse(0);

            interview.completeInterview((int)avg, (String) resultMap.get("overall"));
            
            return InterviewResponse.from(interviewRepository.save(interview));
        } catch (Exception e) {
            throw new RuntimeException("면접 종료 처리 실패");
        }
    }

    private String getPersona(Interview.InterviewType type) {
        return switch (type) {
            case personality -> "당신은 따뜻하지만 예리한 인사팀 면접관입니다. 지원자의 인성과 가치관을 파악하는 것이 목적입니다.";
            case technical -> "당신은 10년 차 이상의 베테랑 기술 면접관입니다. 지원자의 실무 능력과 기술적 깊이를 엄격하게 검증합니다.";
            case pt -> "당신은 논리력을 중시하는 팀장급 면접관입니다. 지원자의 문제 해결 능력과 발표력을 평가합니다.";
        };
    }

    private String generateQuestion(Interview interview, Portfolio portfolio, Resume resume, 
                                   JobPosting job, Company company, String previousAnswer) {
        String persona = getPersona(interview.getInterviewType());
        String systemPrompt = String.format("""
                %s
                
                [면접 환경 정보]
                - 회사: %s
                - 직무: %s
                - 인재상: %s
                
                [지원자 정보]
                - 포트폴리오/경험: %s
                - 자소서 내용: %s
                
                [미션]
                1. 지원자의 '포트폴리오'와 '자소서', 그리고 '기업의 요구사항'을 결합하여 매우 구체적이고 날카로운 면접 질문을 던지세요.
                2. 첫 질문이라면 지원자의 가장 핵심적인 프로젝트나 경험에 대해 구체적으로 물어보며 시작하십시오.
                3. 반드시 한국어로, 면접관의 어투(~하십시오, ~입니까? 등)를 사용하세요.
                4. 질문 외에 다른 설명은 하지 마세요.
                """, persona, job.getCompanyName(), job.getJobTitle(), 
                (company != null ? company.getTalentType() : "일반적 인재"),
                formatPortfolio(portfolio), (resume != null ? resume.getGeneratedText() : "없음"));

        return aiService.analyzeContent("면접을 시작합니다. 첫 질문을 해주세요.", systemPrompt);
    }

    @SuppressWarnings("unchecked")
    private String formatPortfolio(Portfolio p) {
        if (p == null) return "정보 없음";
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("GPA: %s, 수상: %s, 자격증: %s", p.getGpa(), p.getAwards(), p.getCertifications()));
        
        if (p.getAdditionalPdfUrls() instanceof List) {
            List<Map<String, String>> experiences = (List<Map<String, String>>) p.getAdditionalPdfUrls();
            for (Map<String, String> exp : experiences) {
                sb.append("\n- 추가경험(").append(exp.get("fileName")).append("): ").append(exp.get("content"));
            }
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> getMyInterviews(User user) {
        return interviewRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(InterviewResponse::from)
                .collect(Collectors.toList());
    }
}
