package com.capstone.back.controller;

import com.capstone.back.domain.Company;
import com.capstone.back.dto.ApiResponse;
import com.capstone.back.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Company Admin", description = "관리자용 기업 정보 관리 API")
@RestController
@RequestMapping("/api/admin/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    /**
     * 모든 회사 목록을 조회합니다.
     */
    @Operation(summary = "전체 회사 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<Company>>> getAllCompanies() {
        List<Company> companies = companyService.getAllCompanies();
        return ResponseEntity.ok(ApiResponse.success("회사 목록 조회 성공", companies));
    }

    /**
     * 특정 회사 정보를 상세 조회합니다.
     */
    @Operation(summary = "회사 상세 조회")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Company>> getCompany(@PathVariable String id) {
        Company company = companyService.getCompany(id);
        return ResponseEntity.ok(ApiResponse.success("회사 상세 정보 조회 성공", company));
    }

    /**
     * 회사 정보를 수정합니다. (인재상, 조직문화 등 관리자 수동 기입)
     */
    @Operation(summary = "회사 정보 수정")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Company>> updateCompany(@PathVariable String id, @RequestBody Company updatedData) {
        Company company = companyService.updateCompany(id, updatedData);
        return ResponseEntity.ok(ApiResponse.success("회사 정보 수정 완료", company));
    }

    /**
     * 회사 정보를 삭제합니다.
     */
    @Operation(summary = "회사 정보 삭제")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCompany(@PathVariable String id) {
        companyService.deleteCompany(id);
        return ResponseEntity.ok(ApiResponse.success("회사 삭제 완료", null));
    }
}
