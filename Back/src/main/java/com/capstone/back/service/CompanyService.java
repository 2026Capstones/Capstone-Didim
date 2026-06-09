package com.capstone.back.service;

import com.capstone.back.domain.Company;
import com.capstone.back.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final WebCrawlingService webCrawlingService;
    private final AiService aiService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CompanyAnalysisResult {
        private String talentType;
        private String culture;
        private java.util.List<String> interviewTypes;
        private java.util.List<String> resumeQuestions;
        private java.util.List<String> preferredSkills;
    }

    /**
     * 새로운 회사를 등록하거나, 이미 있으면 기존 정보를 반환합니다.
     * 추가로 URL이 있다면 웹 정보를 분석하여 기업 상세 정보를 채웁니다.
     */
    @Transactional
    public Company getOrCreateCompany(String companyName, String jobUrl, String jobDescription) {
        Company company = companyRepository.findByCompanyName(companyName)
                .orElseGet(() -> companyRepository.save(Company.builder().companyName(companyName).build()));

        // 이미 정보가 가득 차 있다면 스킵 (테스트 시에는 매번 업데이트할 수도 있음)
        if (company.getTalentType() != null && company.getCulture() != null) {
            return company;
        }

        // 1. 웹 크롤링 수행 (URL이 있는 경우)
        String webContent = "";
        if (jobUrl != null && !jobUrl.isEmpty()) {
            webContent = webCrawlingService.extractTextFromUrl(jobUrl);
        }

        // 2. AI 분석 요청 (공고 내용 + 웹 내용)
        String combinedContext = "회사명: " + companyName + "\n\n[채용 공고 내용]\n" + jobDescription + "\n\n[홈페이지 내용]\n" + webContent;

        String systemPrompt = """
                너는 기업 분석 전문가야. 제공된 회사 관련 텍스트에서 다음 항목들을 찾아 JSON 형식으로만 응답해줘.
                형식은 반드시 아래와 같은 JSON 구조여야 해:
                {
                  "talentType": "회사의 인재상 요약 (문장형)",
                  "culture": "조직 문화 및 가치 요약 (문장형)",
                  "interviewTypes": ["기술면접", "임원면접", "코딩테스트" 등 리스트],
                  "resumeQuestions": ["자소서 주요 문항 또는 예상 질문 리스트"],
                  "preferredSkills": ["선호하는 기술 스택 또는 역량 리스트"]
                }
                찾을 수 없는 항목은 빈 리스트([]) 또는 null로 처리해.
                설명이나 다른 말은 일절 하지 말고 오직 JSON만 출력해.
                """;

        String aiResponse = aiService.analyzeContent(combinedContext, systemPrompt);
        String jsonOnly = extractJson(aiResponse);

        try {
            CompanyAnalysisResult result = objectMapper.readValue(jsonOnly, CompanyAnalysisResult.class);

            // 3. 분석 결과로 기업 정보 업데이트
            Company updatedCompany = Company.builder()
                    .companyId(company.getCompanyId())
                    .companyName(company.getCompanyName())
                    .talentType(result.getTalentType() != null ? result.getTalentType() : company.getTalentType())
                    .culture(result.getCulture() != null ? result.getCulture() : company.getCulture())
                    .interviewTypes(result.getInterviewTypes() != null ? result.getInterviewTypes() : company.getInterviewTypes())
                    .resumeQuestions(result.getResumeQuestions() != null ? result.getResumeQuestions() : company.getResumeQuestions())
                    .preferred_skills(result.getPreferredSkills() != null ? result.getPreferredSkills() : company.getPreferred_skills())
                    .createdAt(company.getCreatedAt())
                    .build();

            return companyRepository.save(updatedCompany);
        } catch (Exception e) {
            System.err.println("기업 상세 정보 AI 분석 실패: " + e.getMessage());
            return company; // 실패 시 기본 정보라도 반환
        }
    }

    private String extractJson(String response) {
        if (response.contains("```json")) {
            return response.substring(response.indexOf("```json") + 7, response.lastIndexOf("```")).trim();
        } else if (response.contains("```")) {
            return response.substring(response.indexOf("```") + 3, response.lastIndexOf("```")).trim();
        }
        return response.trim();
    }

    @Transactional(readOnly = true)
    public List<Company> getAllCompanies() {

        return companyRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Company getCompany(String id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found: " + id));
    }

    @Transactional
    public Company updateCompany(String id, Company updatedData) {
        Company company = getCompany(id);
        
        Company newCompany = Company.builder()
                .companyId(company.getCompanyId())
                .companyName(updatedData.getCompanyName())
                .talentType(updatedData.getTalentType())
                .culture(updatedData.getCulture())
                .interviewTypes(updatedData.getInterviewTypes())
                .resumeQuestions(updatedData.getResumeQuestions())
                .preferred_skills(updatedData.getPreferred_skills())
                .createdAt(company.getCreatedAt())
                .build();
        
        return companyRepository.save(newCompany);
    }

    @Transactional
    public void deleteCompany(String id) {
        companyRepository.deleteById(id);
    }
}
