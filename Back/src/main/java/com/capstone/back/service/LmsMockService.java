package com.capstone.back.service;

import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class LmsMockService {

    @Getter
    @Builder
    public static class LmsData {
        private BigDecimal gpa;
        private List<Map<String, Object>> awards;
        private List<Map<String, Object>> scholarships;
        private List<Map<String, Object>> volunteer;
        private List<Map<String, Object>> certifications;
    }

    public LmsData getMockLmsData(String email) {
        // 실제 LMS API 연동 전 테스트를 위한 하드코딩된 더미 데이터
        return LmsData.builder()
                .gpa(new BigDecimal("4.25"))
                .awards(List.of(
                        Map.of("name", "창의 융합 캡스톤 디자인 경진대회 금상", "year", 2024),
                        Map.of("name", "전공 역량 강화 해커톤 우수상", "year", 2023)
                ))
                .scholarships(List.of(
                        Map.of("name", "성적우수장학금(백마)", "semester", "2024-1"),
                        Map.of("name", "희망사다리 장학금", "semester", "2023-2")
                ))
                .volunteer(List.of(
                        Map.of("org", "교내 멘토링 프로그램", "hours", 40),
                        Map.of("org", "지역 아동 센터 교육 봉사", "hours", 30)
                ))
                .certifications(List.of(
                        Map.of("name", "정보처리기사", "date", "2024-05"),
                        Map.of("name", "SQLD", "date", "2023-11"),
                        Map.of("name", "TOEIC (850)", "date", "2024-02")
                ))
                .build();
    }
}
