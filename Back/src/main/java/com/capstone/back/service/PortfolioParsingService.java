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
    }

    /**
     * PDF에서 추출된 텍스트를 AI를 통해 구조화된 데이터로 변환합니다.
     */
    public ExtractedPortfolio parseTextToPortfolio(String text) {
        String systemPrompt = """
                너는 대학생의 포트폴리오 데이터를 정형화하는 전문가야.
                제공된 텍스트에서 다음 항목들을 찾아 JSON 형식으로만 응답해줘.
                형식은 반드시 아래와 같아야 해:
                {
                  "gpa": 4.5, (숫자만)
                  "awards": [{"name": "수상명", "year": 2024}],
                  "scholarships": [{"name": "장학금명", "semester": "2024-1"}],
                  "volunteer": [{"org": "기관명", "hours": 40}],
                  "certifications": [{"name": "자격증명", "date": "2024-05"}]
                }
                찾을 수 없는 항목은 빈 리스트([])로 처리하고, GPA를 찾을 수 없으면 null로 해줘.
                설명이나 다른 말은 일절 하지 말고 오직 JSON만 출력해.
                """;

        String aiResponse = aiService.analyzeContent(text, systemPrompt);
        
        // AI 응답에서 JSON 부분만 추출 (가끔 AI가 ```json ... ``` 로 감싸는 경우 대비)
        String jsonOnly = extractJson(aiResponse);

        try {
            return objectMapper.readValue(jsonOnly, ExtractedPortfolio.class);
        } catch (JsonProcessingException e) {
            log.error("AI 응답 JSON 파싱 실패: {}", e.getMessage());
            log.error("원본 응답: {}", aiResponse);
            throw new RuntimeException("AI 응답을 처리하는 중 오류가 발생했습니다.");
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
}
