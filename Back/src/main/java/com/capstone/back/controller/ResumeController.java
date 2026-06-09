package com.capstone.back.controller;

import com.capstone.back.domain.Resume;
import com.capstone.back.domain.User;
import com.capstone.back.dto.ApiResponse;
import com.capstone.back.dto.ResumeResponse;
import com.capstone.back.repository.UserRepository;
import com.capstone.back.service.ResumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Resume", description = "AI 자소서 생성 및 관리 API")
@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final UserRepository userRepository;

    @Operation(summary = "AI 맞춤형 자소서 생성", description = "포트폴리오와 매칭 결과를 기반으로 AI가 자기소개서를 생성합니다.")
    @PostMapping("/generate/{jobId}")
    public ResponseEntity<ApiResponse<ResumeResponse>> generateResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId) {
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        ResumeResponse resume = resumeService.generateResume(user, jobId);
        return ResponseEntity.ok(ApiResponse.success("자소서 생성 완료", resume));
    }

    @Operation(summary = "생성된 자소서 조회")
    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<ResumeResponse>> getResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId) {
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        ResumeResponse resume = resumeService.getResume(user, jobId);
        return ResponseEntity.ok(ApiResponse.success("자소서 조회 성공", resume));
    }

    @Operation(summary = "내 모든 자소서 목록 조회")
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<ResumeResponse>>> getAllResumes(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        return ResponseEntity.ok(ApiResponse.success("자소서 목록 조회 성공", resumeService.getAllResumes(user)));
    }

    @Operation(summary = "자소서 수동 수정", description = "생성된 자소서의 내용을 사용자가 직접 수정합니다.")
    @PutMapping("/{jobId}")
    public ResponseEntity<ApiResponse<ResumeResponse>> updateResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId,
            @RequestBody String newText) {
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        ResumeResponse resume = resumeService.updateResume(user, jobId, newText);
        return ResponseEntity.ok(ApiResponse.success("자소서 수정 완료", resume));
    }

    @Operation(summary = "자소서 삭제")
    @DeleteMapping("/{jobId}")
    public ResponseEntity<ApiResponse<Void>> deleteResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId) {
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        resumeService.deleteResume(user, jobId);
        return ResponseEntity.ok(ApiResponse.success("자소서 삭제 완료", null));
    }
}
