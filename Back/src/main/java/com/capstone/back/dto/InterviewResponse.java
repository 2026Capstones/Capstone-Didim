package com.capstone.back.dto;

import com.capstone.back.domain.Interview;
import com.capstone.back.domain.InterviewQa;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewResponse {
    private String interviewId;
    private String jobTitle;
    private String companyName;
    private String interviewType;
    private String status;
    private Integer totalScore;
    private String overallFeedback;
    private List<QaResponse> qaList;
    private LocalDateTime createdAt;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QaResponse {
        private String qaId;
        private String questionType;
        private String question;
        private String answer;
        private String feedback;
        private Integer score;
        private Integer orderNum;

        public static QaResponse from(InterviewQa qa) {
            return QaResponse.builder()
                    .qaId(qa.getQaId())
                    .questionType(qa.getQuestionType().name())
                    .question(qa.getQuestion())
                    .answer(qa.getAnswer())
                    .feedback(qa.getFeedback())
                    .score(qa.getScore())
                    .orderNum(qa.getOrderNum())
                    .build();
        }
    }

    public static InterviewResponse from(Interview interview) {
        return InterviewResponse.builder()
                .interviewId(interview.getInterviewId())
                .jobTitle(interview.getJobPosting() != null ? interview.getJobPosting().getJobTitle() : interview.getJobType())
                .companyName(interview.getJobPosting() != null ? interview.getJobPosting().getCompanyName() : "N/A")
                .interviewType(interview.getInterviewType().name())
                .status(interview.getStatus().name())
                .totalScore(interview.getTotalScore())
                .overallFeedback(interview.getOverallFeedback())
                .qaList(interview.getQaList().stream().map(QaResponse::from).collect(Collectors.toList()))
                .createdAt(interview.getCreatedAt())
                .build();
    }
}
