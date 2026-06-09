package com.capstone.back.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    @Value("${spring.ai.openai.base-url:http://203.255.224.60:4000}")
    private String baseUrl;

    @Value("${AI-KEY:sk-XcKInxRgDIuBBt8jsK8nMQ}")
    private String apiKey;

    @Value("${spring.ai.openai.chat.options.model:yc-gemma-4-26b-a4b}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 추출된 텍스트를 LLM에 전달하여 분석 결과를 받습니다.
     * @param content 분석할 텍스트 내용
     * @param systemPrompt AI에게 줄 역할 부여(System Prompt)
     * @return AI 응답 텍스트
     */
    public String analyzeContent(String content, String systemPrompt) {
        String url = baseUrl + "/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        // OpenAI Chat Completion 규격 데이터 생성
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", content));
        
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.0);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("학교 LLM API 요청 전송: {}", url);
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            
            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        } catch (Exception e) {
            log.error("AI 분석 중 오류 발생: {}", e.getMessage());
            return "AI 분석 실패: " + e.getMessage();
        }

        return "AI 응답을 파싱할 수 없습니다.";
    }
}
