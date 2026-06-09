package com.capstone.back.controller;

import com.capstone.back.domain.JobPosting;
import com.capstone.back.dto.ApiResponse;
import com.capstone.back.service.JobPostingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Job Posting", description = "채용 공고 조회 API (학생/관리자 공용)")
@RestController
@RequestMapping("/api/job-postings")
@RequiredArgsConstructor
public class JobPostingController {

    private final JobPostingService jobPostingService;

    /**
     * 채용 공고 전체 목록을 조회합니다.
     */
    @Operation(summary = "전체 채용 공고 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<JobPosting>>> getAllJobPostings() {
        List<JobPosting> list = jobPostingService.getAllJobPostings();
        return ResponseEntity.ok(ApiResponse.success("채용 공고 목록 조회 성공", list));
    }

    /**
     * 특정 채용 공고의 상세 정보를 조회합니다.
     */
    @Operation(summary = "채용 공고 상세 조회")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobPosting>> getJobPosting(@PathVariable String id) {
        JobPosting job = jobPostingService.getJobPosting(id);
        return ResponseEntity.ok(ApiResponse.success("채용 공고 상세 조회 성공", job));
    }
}
