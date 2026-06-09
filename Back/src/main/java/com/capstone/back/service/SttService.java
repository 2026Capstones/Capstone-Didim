package com.capstone.back.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SttService {

    @Value("${OPENAI-KEY}")
    private String openAiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 음성 파일을 텍스트로 변환합니다 (OpenAI 공식 API 직접 호출).
     * [알림] STT 기능은 향후 Python 서버에서 처리할 예정이므로 임시 주석 처리합니다.
     */
    public String transcribe(MultipartFile file) {
        /*
        String url = "https://api.openai.com/v1/audio/transcriptions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(openAiKey.trim());

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            
            Resource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            
            body.add("file", resource);
            body.add("model", "whisper-1");

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            log.info("OpenAI 공식 STT API 요청 전송: {}", url);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("text");
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("OpenAI STT API 응답 에러 ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("OpenAI STT 요청 중 예외 발생: {}", e.getMessage());
        }
        */

        return "STT 기능이 비활성화되었습니다. (Python 서버로 이전 예정)";
    }
}
