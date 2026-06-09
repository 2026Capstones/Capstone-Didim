
# 백엔드 작업 수정 내역 (Fixes Log)

이 파일은 프로젝트 개발 과정에서 발생하는 주요 수정 사항 및 변경 이력을 기록합니다.

## [2026-06-06] Phase 1: 초기 환경 설정 진행
- `build.gradle`: JPA, Security, JWT, PDFBox 등 필수 의존성 추가 및 Spring Boot 버전 최적화
- `src/main/resources/application.properties`: H2 인메모리 DB 설정 및 JWT/파일 업로드 관련 설정 추가
- `com.capstone.back.config.WebConfig`: 프론트엔드 연동을 위한 전역 CORS 설정 추가
- JPA Entity 생성: `User`, `Portfolio`, `JobPosting`, `Resume`, `Interview`, `InterviewQa`, `MatchResult`, `Company` 및 공통 `JsonConverter` 구현
- 보안 및 인증: `JwtTokenProvider`, `JwtAuthenticationFilter`, `SecurityConfig`, `CustomUserDetailsService` 구현
- API 연동: `AuthController` (로그인 API) 구현
- 공통 처리: `ApiResponse` 공통 응답 구조 및 `GlobalExceptionHandler` 전역 예외 처리 구현
- [버전 수정] Java 17 및 Gradle 9.3.0 호환성을 위해 Spring Boot (3.4.1) 및 Dependency Management (1.1.7) 버전 수정 및 빌드 성공 확인
- [에러 해결] 이전 버전(4.0.6)의 잔재로 인한 `UserDetailsService` 로드 실패 에러 해결 (Gradle Clean 및 의존성 강제 새로고침 수행)
- [에러 해결] H2 데이터베이스에서 `USER`가 예약어로 사용되어 테이블 생성 시 발생하는 Syntax Error 해결 (`NON_KEYWORDS=USER` 설정 추가)
- [Phase 2] LMS 더미 데이터 연동(Mock Service) 및 포트폴리오 자동 갱신 API (`/api/portfolio/lms`) 구현
- [Phase 2] PDF 파싱 모듈 구현 (`PdfParsingService`): Apache PDFBox를 사용하여 PDF 텍스트 추출 로직 완성
- [환경 설정] Swagger(Springdoc OpenAPI) 설정 추가: API 테스트 및 문서화를 위한 Swagger UI 구성 및 보안 예외 설정
- [에러 해결] 로그인 테스트 시 400(Bad Request) 에러 해결: `data.sql` 내 BCrypt 해시값 손상(길이 부족) 확인 후 `BackApplication`에서 `CommandLineRunner`를 통해 정상적인 테스트 계정(`admin`, `student`)을 자동 생성하도록 수정
- [AI 연동] 학교 LLM 서버(LiteLLM/OpenAI 호환) 연동 완료: `AiService`를 통해 `yc-gemma-4-26b-a4b` 모델과 통신 구현
- [기능 구현] PDF 기반 포트폴리오 자동화: PDF 업로드 시 텍스트 추출 -> AI 구조화(JSON) -> DB 저장 프로세스 완성 (`PortfolioParsingService`, `PortfolioController`)
- [기능 보완] 포트폴리오 데이터 통합(Merge) 로직: PDF 업로드 시 기존 LMS 데이터(더미)와 새로 추출된 데이터를 합쳐서(Append) 저장하도록 개선
- [에러 해결] AI 응답 파싱 시 Jackson Deserialization 에러 해결: `ExtractedPortfolio` DTO에 기본 생성자(`@NoArgsConstructor`) 및 전체 생성자 추가
- [설정 변경] `application.properties`에 `spring.profiles.active=prod` 및 `application-prod.yml` 임포트 설정 추가하여 학교 AI 서버 환경 활성화
- [기능 구현] 관리자용 채용 공고 자동화: PDF 업로드 -> AI 분석(회사명, 직무, 요구사항 등 추출) -> DB 저장 프로세스 완성 (`JobPostingParsingService`, `AdminJobPostingController`)
- [기능 구현] 채용 공고 CRUD 완성: 관리자용 수정/삭제 API 및 학생/관리자 공용 목록/상세 조회 API 구현
- [기능 구현] 학생 포트폴리오 RUD 보완: 수동 수정(Update) 및 삭제(Delete) API 추가
- [DB 추가] `JobPostingRepository` 인터페이스 생성 및 `JobPostingService` 비즈니스 로직 구현
- [연동 강화] 채용 공고 등록 시 기업 정보 자동 연동: 새로운 회사인 경우 `Company` 테이블에 자동 등록되도록 `JobPostingService` 로직 보완
- [기능 구현] 관리자용 기업 정보(Company) CRUD 완성: 기업별 인재상, 면접 질문 등 상세 관리를 위한 API 개발 (`CompanyController`, `CompanyService`)
- [기능 구현] 기업 정보 심층 분석 자동화: `Jsoup` 라이브러리를 활용하여 채용 홈페이지 URL 크롤링 기능 구현 및 AI 분석을 통해 인재상, 조직문화, 면접 문항 등을 자동 추출하도록 로직 고도화
- [의존성 추가] 웹 데이터 수집을 위한 `org.jsoup:jsoup` 의존성 추가

## [2026-06-07] Phase 4: AI 기반 취업 지원 핵심 서비스 구현
- [기능 구현] AI 취업 매칭 시스템: 사용자의 포트폴리오(PDF+LMS)와 채용 공고/기업 정보를 AI로 분석하여 매칭 점수(%)와 사유를 산출하는 `MatchService`, `MatchController` 구현
- [기능 구현] AI 맞춤형 자소서 생성: 매칭 분석 결과를 바탕으로 기업별 맞춤 자기소개서를 자동 생성하는 `ResumeService`, `ResumeController` 구현
- [환경 설정] 비동기 처리 기반 구축: `@EnableAsync` 및 `ThreadPoolTaskExecutor` 설정을 위한 `AsyncConfig` 추가
- [구조 개선] 공통 응답 DTO(`ApiResponse`) 리팩토링: 특정 엔티티 의존성 제거 및 제네릭/메시지 처리 강화
- [버그 수정] 컨트롤러 전면 수정: 모든 컨트롤러(`Company`, `Portfolio`, `JobPosting` 등)에서 발생하던 미정의 변수(`result`) 참조 에러 해결 및 공통 응답 규격 적용
- [문서화] Swagger(`@Operation`) 추가: 새로 생성 및 수정된 모든 API 엔드포인트에 상세 설명 추가
- [DB 추가] `MatchResultRepository`, `ResumeRepository` 생성 및 데이터 영속화 로직 구현

## [2026-06-07] Phase 4: AI 기반 취업 지원 핵심 서비스 구현 및 고도화
- [기능 구현] AI 취업 매칭 시스템: 사용자의 포트폴리오(PDF+LMS)와 채용 공고/기업 정보를 AI로 분석하여 매칭 점수(%)와 구체적인 사유를 산출하는 `MatchService`, `MatchController` 구현
- [기능 구현] AI 맞춤형 자소서 생성: 매칭 분석 결과를 바탕으로 기업의 인재상에 최적화된 자기소개서를 자동 생성하는 `ResumeService` 구현
- [기능 구현] Resume CRUD 완성: 자소서 전체 목록 조회(`GET /api/resume/list`), 개별 수동 수정(`PUT /api/resume/{jobId}`), 삭제(`DELETE /api/resume/{jobId}`) 기능 구현
- [구조 개선] 자소서 응답 DTO 도입: `ResumeResponse` DTO를 통해 400 에러(JSON 직렬화) 해결 및 엔티티 노출 방지
- [DB 확장] `Portfolio` 테이블 다중 경험 지원: 기존 단일 URL 필드를 JSON 리스트 형태의 `additional_pdf_urls`로 변경하여 여러 개의 추가 자료 등록 지원
- [기능 고도화] 추가 경험 PDF 텍스트 자동 추출: 업로드 시 `PdfParsingService`를 통해 텍스트를 즉시 추출하여 DB에 저장, 자소서 생성 시 AI가 이 텍스트를 분석하여 경험 섹션에 반영하도록 로직 고도화
- [기능 구현] AI 면접 시뮬레이션: 면접 유형별(인성, 기술, PT) 페르소나 설정 및 AI 핑퐁 질문 생성 로직 구현 (`InterviewService`)
- [기능 구현] 음성 처리 연동(STT/TTS): 학교 AI 서버를 활용한 음성-텍스트 상호 변환 API 구현 (`SttService`, `TtsService`)
- [기능 구현] 면접 답변 자동 평가: 사용자 답변에 대한 실시간 피드백 및 점수 산출 로직 완성
- [버그 수정] Portfolio 데이터 유실 해결: LMS 갱신 및 AI 분석 시 기존에 등록된 `additionalPdfUrls` 데이터가 `null`로 초기화되던 빌더 패턴 누락 버그 수정
- [환경 설정] 비동기 처리 기반 구축: `@EnableAsync` 및 `ThreadPoolTaskExecutor` 설정을 위한 `AsyncConfig` 추가
- [문서화] Swagger(`@Operation`) 전면 적용: 모든 신규/수정 API 엔드포인트에 상세 설명 및 태그 추가

## [2026-06-07] AI 면접 아키텍처 최종 설계 및 문서화
- [설계 확정] 분산 처리 기반 AI 면접 시스템: FastAPI가 매 질문의 미디어를 분석하여 피드백을 즉시 생성하되, Spring Boot가 이를 DB에 은닉 저장했다가 면접 종료 시 일괄 제공하는 최적화된 흐름 확정
- [명세 교정] Spring-FastAPI 통신 규격 고도화: 디스크 I/O 최적화를 위해 URL 전달 방식에서 MultipartFormData 파일 직접 전송 방식으로 변경 및 면접 맥락(Context) 데이터 포함
- [문서화] `SpringWithPythonServer.md` 작성: 전체 시퀀스 다이어그램, 서버별 개발 요구사항, 독보적 차별점(개인 맞춤형 심층 질문 등) 상세 기록
- [버그 수정] OpenAI TTS 연동: 학교 서버의 오디오 모델 부재로 인한 500 에러 해결을 위해 OpenAI 공식 API(`gpt-4o-mini-tts`)로 전환 및 연동 성공





