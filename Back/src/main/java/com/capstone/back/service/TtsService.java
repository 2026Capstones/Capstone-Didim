package com.capstone.back.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TtsService {

    @Value("${OPENAI-KEY}")
    private String openAiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 텍스트를 음성으로 변환합니다 (OpenAI 공식 API 직접 호출).
     */
    public byte[] speak(String text) {
        String url = "https://api.openai.com/v1/audio/speech";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiKey.trim());

        Map<String, Object> requestBody = new HashMap<>();
        // 사용자가 요청한 최신 모델 gpt-4o-mini-tts 사용
        requestBody.put("model", "gpt-4o-mini-tts"); 
        requestBody.put("input", text);
        requestBody.put("voice", "alloy");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("OpenAI 공식 TTS API 요청 전송: {}", url);
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.POST, entity, byte[].class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("OpenAI TTS 변환 성공: {} bytes", response.getBody() != null ? response.getBody().length : 0);
                return response.getBody();
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("OpenAI TTS API 응답 에러 ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("OpenAI TTS 요청 중 예외 발생: {}", e.getMessage());
        }

        return null;
    }
}
