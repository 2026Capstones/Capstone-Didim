package com.capstone.back.dto;

import com.capstone.back.domain.Resume;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeResponse {
    private String resumeId;
    private String jobId;
    private String jobTitle;
    private String companyName;
    private String generatedText;
    private LocalDateTime createdAt;

    public static ResumeResponse from(Resume resume) {
        return ResumeResponse.builder()
                .resumeId(resume.getResumeId())
                .jobId(resume.getJobPosting().getJobId())
                .jobTitle(resume.getJobPosting().getJobTitle())
                .companyName(resume.getJobPosting().getCompanyName())
                .generatedText(resume.getGeneratedText())
                .createdAt(resume.getCreatedAt())
                .build();
    }
}
