package com.capstone.back.controller;

import com.capstone.back.domain.MatchResult;
import com.capstone.back.domain.User;
import com.capstone.back.dto.ApiResponse;
import com.capstone.back.repository.UserRepository;
import com.capstone.back.service.MatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Match", description = "취업 매칭 API")
@RestController
@RequestMapping("/api/match")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final UserRepository userRepository;

    @Operation(summary = "채용 공고 매칭 점수 계산", description = "특정 채용 공고와 내 포트폴리오의 일치도를 계산합니다.")
    @PostMapping("/calculate/{jobId}")
    public ApiResponse<MatchResult> calculateMatch(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId) {
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        MatchResult result = matchService.calculateMatch(user, jobId);
        return ApiResponse.success("매칭 점수 산출 완료", result);
    }
}
