package com.capstone.back.controller;

import com.capstone.back.domain.User;
import com.capstone.back.dto.ApiResponse;
import com.capstone.back.dto.InterviewResponse;
import com.capstone.back.repository.UserRepository;
import com.capstone.back.service.InterviewService;
import com.capstone.back.service.SttService;
import com.capstone.back.service.TtsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "Interview", description = "AI 면접 시뮬레이션 API")
@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final UserRepository userRepository;
    private final SttService sttService;
    private final TtsService ttsService;

    @Operation(summary = "면접 시작", description = "채용 공고와 유형을 선택하여 AI 면접을 시작하고 첫 질문을 받습니다.")
    @PostMapping("/start/{jobId}")
    public ResponseEntity<ApiResponse<InterviewResponse>> startInterview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId,
            @RequestParam String type) {
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        InterviewResponse response = interviewService.startInterview(user, jobId, type);
        return ResponseEntity.ok(ApiResponse.success("면접 세션 시작 완료", response));
    }

    @Operation(summary = "내 면접 목록 조회")
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<InterviewResponse>>> getMyInterviews(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        return ResponseEntity.ok(ApiResponse.success("내 면접 목록 조회 성공", interviewService.getMyInterviews(user)));
    }

    @Operation(summary = "답변 제출 및 다음 질문 받기", description = "사용자의 답변을 제출하면 AI가 평가하고 다음 질문을 생성합니다.")
    @PostMapping(value = "/answer/{interviewId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<InterviewResponse>> submitAnswer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String interviewId,
            @RequestParam("audioFile") MultipartFile audioFile,
            @RequestParam("videoFile") MultipartFile videoFile) {
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        InterviewResponse response = interviewService.submitAnswer(user, interviewId, audioFile, videoFile);
        return ResponseEntity.ok(ApiResponse.success("답변 처리 완료", response));
    }

    /*
    @Operation(summary = "음성 답변 텍스트 변환 (STT)", description = "지원자의 음성 파일을 텍스트로 변환합니다. (현재 Python 서버 이전 준비를 위해 비활성화)")
    @PostMapping(value = "/stt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> convertSpeechToText(@RequestParam("file") MultipartFile file) {
        String text = sttService.transcribe(file);
        return ResponseEntity.ok(ApiResponse.success("음성 변환 성공", text));
    }
    */

    @Operation(summary = "텍스트 음성 변환 (TTS)", description = "질문 텍스트를 음성으로 변환합니다.")
    @PostMapping("/tts")
    public ResponseEntity<byte[]> convertTextToSpeech(@RequestBody String text) {
        byte[] audioData = ttsService.speak(text);
        if (audioData == null) return ResponseEntity.internalServerError().build();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                .body(audioData);
    }
}
