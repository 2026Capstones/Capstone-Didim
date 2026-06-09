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

    @Value("${ai.server.url:http://127.0.0.1:8000}")
    private String aiServerUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * FastAPI AI 서버로 영상/음성 분석을 요청합니다.
     */
    public Map<String, Object> analyzeInterview(org.springframework.web.multipart.MultipartFile video, 
                                               org.springframework.web.multipart.MultipartFile audio, 
                                               String contextData) {
        String url = aiServerUrl + "/analyze-and-feedback";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
        
        // 비디오 파일 추가 (파일명 및 컨텐츠 타입 명시)
        body.add("video_file", createFileEntity("video_file", video));
        
        // 오디오 파일 추가 (있는 경우)
        if (audio != null && !audio.isEmpty()) {
            body.add("audio_file", createFileEntity("audio_file", audio));
        }
        
        body.add("context_data", contextData);

        HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            log.info("AI 분석 서버 요청 전송: {}", url);
            return restTemplate.postForObject(url, requestEntity, Map.class);
        } catch (Exception e) {
            log.error("AI 분석 서버 통신 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException("AI 분석 서버 통신 실패: " + e.getMessage());
        }
    }

    private HttpEntity<org.springframework.core.io.Resource> createFileEntity(String fieldName, org.springframework.web.multipart.MultipartFile file) {
        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentDispositionFormData(fieldName, file.getOriginalFilename());
        try {
            fileHeaders.setContentType(MediaType.parseMediaType(file.getContentType()));
        } catch (Exception e) {
            fileHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        }
        return new HttpEntity<>(file.getResource(), fileHeaders);
    }

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
