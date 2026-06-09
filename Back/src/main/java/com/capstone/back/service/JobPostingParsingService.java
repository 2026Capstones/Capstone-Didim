package com.capstone.back.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobPostingParsingService {

    private final AiService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtractedJobPosting {
        private String companyName;
        private String jobTitle;
        private String deadline; // YYYY-MM-DD 형식 또는 "상시채용"
        private String salary;
        private String requirements;
        private String description;
        private String jobUrl; // 채용 홈페이지 URL 추가
    }

    /**
     * 채용 공고 PDF에서 추출된 텍스트를 AI를 통해 구조화된 데이터 리스트로 변환합니다.
     */
    public List<ExtractedJobPosting> parseTextToJobPostingList(String text) {
        String systemPrompt = """
                너는 HR 전문가야. 제공된 채용 공고 텍스트에서 모든 채용 정보를 찾아 JSON 리스트 형식으로만 응답해줘.
                특히, 텍스트 내용 중에 채용 홈페이지 주소나 관련 URL이 있다면 반드시 'jobUrl' 필드에 넣어줘.
                
                형식은 반드시 아래와 같이 JSON 배열([]) 형태여야 해:
                [
                  {
                    "companyName": "회사 이름",
                    "jobTitle": "채용 직무 이름",
                    "deadline": "YYYY-MM-DD", (찾을 수 없으면 "상시채용" 또는 null)
                    "salary": "연봉 정보",
                    "requirements": "자격 요건 요약",
                    "description": "담당 업무 요약",
                    "jobUrl": "채용 홈페이지 URL 또는 관련 링크 (찾을 수 없으면 null)"
                  }
                ]
                설명이나 다른 말은 일절 하지 말고 오직 JSON 배열만 출력해.
                """;

        String aiResponse = aiService.analyzeContent(text, systemPrompt);
        String jsonOnly = extractJson(aiResponse);

        try {
            // JSON이 배열인지 단일 객체인지 판단하여 리스트로 변환
            if (jsonOnly.trim().startsWith("[")) {
                return objectMapper.readValue(jsonOnly, new TypeReference<List<ExtractedJobPosting>>() {});
            } else {
                ExtractedJobPosting single = objectMapper.readValue(jsonOnly, ExtractedJobPosting.class);
                return Collections.singletonList(single);
            }
        } catch (JsonProcessingException e) {
            log.error("채용 공고 AI 응답 JSON 파싱 실패: {}", e.getMessage());
            log.error("원본 응답: {}", aiResponse);
            throw new RuntimeException("채용 공고 AI 응답을 처리하는 중 오류가 발생했습니다.");
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
