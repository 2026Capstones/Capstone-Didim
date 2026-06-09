package com.capstone.back.controller;

import com.capstone.back.domain.Portfolio;
import com.capstone.back.dto.ApiResponse;
import com.capstone.back.service.AiService;
import com.capstone.back.service.PdfParsingService;
import com.capstone.back.service.PortfolioParsingService;
import com.capstone.back.service.PortfolioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Tag(name = "Portfolio", description = "학생 포트폴리오 관리 API")
@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final PdfParsingService pdfParsingService;
    private final AiService aiService;
    private final PortfolioParsingService portfolioParsingService;

    @Operation(summary = "LMS 데이터 갱신", description = "학교 LMS에서 정보를 가져와 포트폴리오를 업데이트합니다.")
    @PostMapping("/lms")
    public ResponseEntity<ApiResponse<Portfolio>> refreshFromLms(@AuthenticationPrincipal UserDetails userDetails) {
        Portfolio updated = portfolioService.refreshPortfolioFromLms(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("LMS 데이터 갱신 성공", updated));
    }

    @Operation(summary = "내 포트폴리오 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<Portfolio>> getMyPortfolio(@AuthenticationPrincipal UserDetails userDetails) {
        Portfolio portfolio = portfolioService.getPortfolioByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("포트폴리오 조회 성공", portfolio));
    }

    @Operation(summary = "포트폴리오 수동 수정")
    @PutMapping
    public ResponseEntity<ApiResponse<Portfolio>> updatePortfolio(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Portfolio updatedData) {
        Portfolio updated = portfolioService.updatePortfolio(userDetails.getUsername(), updatedData);
        return ResponseEntity.ok(ApiResponse.success("포트폴리오 수정 완료", updated));
    }

    @Operation(summary = "포트폴리오 삭제")
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deletePortfolio(@AuthenticationPrincipal UserDetails userDetails) {
        portfolioService.deletePortfolio(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("포트폴리오 삭제 완료", null));
    }

    @Operation(summary = "PDF 포트폴리오 업로드 및 AI 분석", description = "PDF 파일을 분석하여 포트폴리오 데이터를 자동 추출 및 병합합니다.")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Portfolio>> uploadAndParsePortfolio(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        try {
            String extractedText = pdfParsingService.extractText(file);
            PortfolioParsingService.ExtractedPortfolio aiData = portfolioParsingService.parseTextToPortfolio(extractedText);
            Portfolio updated = portfolioService.updatePortfolioFromAi(userDetails.getUsername(), aiData);
            
            return ResponseEntity.ok(ApiResponse.success("PDF 분석 및 포트폴리오 업데이트 완료", updated));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("PDF 파일 처리 실패: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("포트폴리오 분석 중 오류 발생: " + e.getMessage()));
        }
    }

    @Operation(summary = "AI 연결 테스트")
    @GetMapping("/ai-health")
    public ResponseEntity<ApiResponse<String>> checkAiConnection() {
        String response = aiService.analyzeContent("연결 확인", "점검 봇");
        return ResponseEntity.ok(ApiResponse.success("AI 통신 정상", response));
    }

    @Operation(summary = "추가 경험 PDF 업로드", description = "부수적인 포트폴리오(경험) PDF에서 텍스트를 추출하여 리스트에 추가합니다.")
    @PostMapping(value = "/upload-additional", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Portfolio>> uploadAdditionalPdf(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        try {
            String fileName = file.getOriginalFilename();
            // PDF에서 실제 텍스트 추출
            String extractedText = pdfParsingService.extractText(file);
            
            Portfolio updated = portfolioService.addAdditionalExperience(userDetails.getUsername(), fileName, extractedText);
            return ResponseEntity.ok(ApiResponse.success("추가 포트폴리오 추출 및 업로드 완료", updated));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("파일 업로드 중 오류 발생: " + e.getMessage()));
        }
    }

    @Operation(summary = "추가 경험 삭제", description = "리스트에서 특정 경험 자료를 제거합니다.")
    @DeleteMapping("/additional")
    public ResponseEntity<ApiResponse<Portfolio>> deleteAdditionalPdf(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("fileName") String fileName) {
        Portfolio updated = portfolioService.deleteAdditionalExperience(userDetails.getUsername(), fileName);
        return ResponseEntity.ok(ApiResponse.success("추가 포트폴리오 삭제 완료", updated));
    }
}
