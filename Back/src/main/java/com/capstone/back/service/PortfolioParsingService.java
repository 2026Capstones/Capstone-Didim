package com.capstone.back.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioParsingService {

    private final AiService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtractedPortfolio {
        private BigDecimal gpa;
        private List<Map<String, Object>> awards;
        private List<Map<String, Object>> scholarships;
        private List<Map<String, Object>> volunteer;
        private List<Map<String, Object>> certifications;
        private List<Map<String, Object>> projects;
    }

    /**
     * PDF에서 추출된 텍스트를 AI를 통해 구조화된 데이터로 변환합니다.
     */
    public ExtractedPortfolio parseTextToPortfolio(String text) {
        String systemPrompt = """
                너는 대학생의 포트폴리오 데이터를 정형화하는 전문가야.
                제공된 텍스트에서 다음 항목들을 찾아 반드시 완전하고 유효한 JSON 형식으로만 응답해줘.
                형식은 반드시 아래와 같아야 해:
                {
                  "gpa": 4.5,
                  "awards": [{"name": "수상명", "year": 2024}],
                  "scholarships": [{"name": "장학금명", "semester": "2024-1"}],
                  "volunteer": [{"org": "기관명", "hours": 40}],
                  "certifications": [{"name": "자격증명", "date": "2024-05"}],
                  "projects": [{"title": "프로젝트명", "period": "기간", "stack": "사용한 기술", "description": "설명요약", "link": "링크"}]
                }
                GPA가 없으면 null, 찾을 수 없는 리스트 항목은 빈 배열([])을 입력해.
                JSON의 모든 키(key)와 문자열 값은 반드시 쌍따옴표(")를 사용해야 해.
                앞뒤에 어떤 설명이나 마크다운 백틱(```json)도 절대 붙이지 말고 순수한 JSON 문자열만 출력해.
                """;

        String aiResponse = aiService.analyzeContent(text, systemPrompt);
        
        // AI 응답에서 JSON 부분만 안정적으로 추출
        String jsonOnly = extractJson(aiResponse);

        try {
            return objectMapper.readValue(jsonOnly, ExtractedPortfolio.class);
        } catch (JsonProcessingException e) {
            log.error("AI 응답 JSON 파싱 실패: {}", e.getMessage());
            log.error("정제된 JSON 시도본: {}", jsonOnly);
            log.error("원본 응답: {}", aiResponse);
            throw new RuntimeException("AI 응답을 처리하는 중 오류가 발생했습니다.");
        }
    }

    private String extractJson(String response) {
        if (response == null) return "{}";
        
        // 마크다운 백틱 제거 시도
        String cleaned = response;
        if (cleaned.contains("```json")) {
            cleaned = cleaned.substring(cleaned.indexOf("```json") + 7);
            if (cleaned.contains("```")) {
                cleaned = cleaned.substring(0, cleaned.indexOf("```"));
            }
        } else if (cleaned.contains("```")) {
            cleaned = cleaned.substring(cleaned.indexOf("```") + 3);
            if (cleaned.contains("```")) {
                cleaned = cleaned.substring(0, cleaned.indexOf("```"));
            }
        }
        
        // 중괄호 안의 내용만 추출 (설명글 제거용)
        int startIndex = cleaned.indexOf('{');
        int endIndex = cleaned.lastIndexOf('}');
        
        if (startIndex >= 0 && endIndex >= startIndex) {
            return cleaned.substring(startIndex, endIndex + 1).trim();
        }
        
        return cleaned.trim();
    }
}
