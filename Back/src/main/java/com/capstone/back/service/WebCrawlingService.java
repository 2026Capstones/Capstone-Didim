package com.capstone.back.service;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Slf4j
@Service
public class WebCrawlingService {

    /**
     * 특정 URL에 접속하여 페이지의 본문 텍스트를 추출합니다.
     * @param url 접속할 웹 페이지 주소
     * @return 추출된 텍스트 내용
     */
    public String extractTextFromUrl(String url) {
        if (url == null || url.isEmpty() || !url.startsWith("http")) {
            log.warn("유효하지 않은 URL입니다: {}", url);
            return "";
        }

        try {
            log.info("웹 크롤링 시작: {}", url);
            // timeout 10초 설정, User-Agent를 브라우저처럼 설정하여 차단 방지
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(10000)
                    .get();

            // 본문 내용만 추출 (스크립트, 스타일 태그 제외)
            String text = doc.body().text();
            log.info("웹 크롤링 완료 (길이: {}자)", text.length());
            
            // 너무 길면 AI 요청 제한에 걸릴 수 있으므로 앞부분 5000자만 우선 자름
            return text.length() > 5000 ? text.substring(0, 5000) : text;
            
        } catch (IOException e) {
            log.error("웹 크롤링 중 오류 발생 (URL: {}): {}", url, e.getMessage());
            return "";
        }
    }
}
