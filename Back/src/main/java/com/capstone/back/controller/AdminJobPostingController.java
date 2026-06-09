package com.capstone.back.controller;

import com.capstone.back.domain.JobPosting;
import com.capstone.back.dto.ApiResponse;
import com.capstone.back.service.JobPostingParsingService;
import com.capstone.back.service.JobPostingService;
import com.capstone.back.service.PdfParsingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "Job Posting Admin", description = "관리자용 채용 공고 관리 API")
@RestController
@RequestMapping("/api/admin/job-posting")
@RequiredArgsConstructor
public class AdminJobPostingController {

    private final JobPostingService jobPostingService;
    private final PdfParsingService pdfParsingService;
    private final JobPostingParsingService jobPostingParsingService;

    /**
     * 채용 공고 PDF를 업로드하여 AI 분석 후 DB에 저장합니다. (다중 공고 지원)
     */
    @Operation(summary = "채용 공고 PDF 업로드 및 AI 분석 등록")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<JobPosting>>> uploadJobPosting(@RequestParam("file") MultipartFile file) {
        try {
            // 1. PDF 텍스트 추출
            String pdfText = pdfParsingService.extractText(file);
            
            // 2. AI 데이터 구조화 (리스트로 받기)
            List<JobPostingParsingService.ExtractedJobPosting> aiDataList = jobPostingParsingService.parseTextToJobPostingList(pdfText);
            
            // 3. DB 저장 및 결과 수집
            List<JobPosting> savedList = new ArrayList<>();
            for (JobPostingParsingService.ExtractedJobPosting aiData : aiDataList) {
                savedList.add(jobPostingService.saveJobPostingFromAi(aiData, pdfText));
            }
            
            return ResponseEntity.ok(ApiResponse.success("채용 공고 PDF 분석 및 등록 완료", savedList));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("PDF 처리 실패: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("채용 공고 분석 중 오류 발생: " + e.getMessage()));
        }
    }

    /**
     * 등록된 모든 채용 공고를 조회합니다.
     */
    @Operation(summary = "전체 채용 공고 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<JobPosting>>> getAllJobPostings() {
        List<JobPosting> list = jobPostingService.getAllJobPostings();
        return ResponseEntity.ok(ApiResponse.success("전체 채용 공고 조회 성공", list));
    }

    /**
     * 채용 공고를 수정합니다.
     */
    @Operation(summary = "채용 공고 수정")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobPosting>> updateJobPosting(@PathVariable String id, @RequestBody JobPosting updatedData) {
        JobPosting updated = jobPostingService.updateJobPosting(id, updatedData);
        return ResponseEntity.ok(ApiResponse.success("채용 공고 수정 완료", updated));
    }

    /**
     * 채용 공고를 삭제합니다.
     */
    @Operation(summary = "채용 공고 삭제")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteJobPosting(@PathVariable String id) {
        jobPostingService.deleteJobPosting(id);
        return ResponseEntity.ok(ApiResponse.success("채용 공고 삭제 완료", null));
    }
}
