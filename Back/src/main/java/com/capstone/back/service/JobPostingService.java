package com.capstone.back.service;

import com.capstone.back.domain.JobPosting;
import com.capstone.back.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
@Slf4j
@Service
@RequiredArgsConstructor
public class JobPostingService {

    private final JobPostingRepository jobPostingRepository;
    private final CompanyService companyService;

    @Transactional
    public JobPosting saveJobPostingFromAi(JobPostingParsingService.ExtractedJobPosting aiData, String pdfText) {
        // 1. 회사 정보 자동 연동 및 심층 분석 (URL/본문 활용)
        companyService.getOrCreateCompany(aiData.getCompanyName(), aiData.getJobUrl(), aiData.getDescription());

        // 2. 채용 공고 저장
        LocalDate deadline = null;

        if (aiData.getDeadline() != null && !aiData.getDeadline().equals("상시채용")) {
            try {
                deadline = LocalDate.parse(aiData.getDeadline());
            } catch (DateTimeParseException e) {
                log.warn("날짜 파싱 실패: {}, null로 설정합니다.", aiData.getDeadline());
            }
        }

        JobPosting jobPosting = JobPosting.builder()
                .companyName(aiData.getCompanyName())
                .jobTitle(aiData.getJobTitle())
                .deadline(deadline)
                .salary(aiData.getSalary())
                .requirements(aiData.getRequirements())
                .description(aiData.getDescription())
                .jobUrl(aiData.getJobUrl()) // 추출된 URL 저장
                .pdfText(pdfText)
                .build();

        return jobPostingRepository.save(jobPosting);
    }

    @Transactional(readOnly = true)
    public List<JobPosting> getAllJobPostings() {
        return jobPostingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public JobPosting getJobPosting(String id) {
        return jobPostingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job posting not found: " + id));
    }

    @Transactional
    public void deleteJobPosting(String id) {
        jobPostingRepository.deleteById(id);
    }

    @Transactional
    public JobPosting updateJobPosting(String id, JobPosting updatedData) {
        JobPosting jobPosting = jobPostingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job posting not found: " + id));

        JobPosting newJobPosting = JobPosting.builder()
                .jobId(jobPosting.getJobId())
                .companyName(updatedData.getCompanyName())
                .jobTitle(updatedData.getJobTitle())
                .deadline(updatedData.getDeadline())
                .salary(updatedData.getSalary())
                .requirements(updatedData.getRequirements())
                .description(updatedData.getDescription())
                .jobUrl(updatedData.getJobUrl())
                .pdfPath(jobPosting.getPdfPath())
                .pdfText(jobPosting.getPdfText())
                .createdAt(jobPosting.getCreatedAt())
                .build();

        return jobPostingRepository.save(newJobPosting);
    }
}
