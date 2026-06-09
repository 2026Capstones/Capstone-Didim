 # 백엔드 개발 체크리스트 (Backend Implementation Checklist)

이 체크리스트는 `backend-design-plan.md` 및 `specification.md`를 바탕으로 백엔드 시스템을 성공적으로 구현하기 위한 단계별 작업 목록입니다.

## 1. 프로젝트 초기 설정 및 기반 구성 (Phase 1)
- [x] **Spring Boot 프로젝트 생성 및 설정**
  - [x] `application.properties` (또는 `application.yml`) 환경 변수 설정 (DB 커넥션, JWT 시크릿, AI API 키 등)
  - [x] CORS 설정 (프론트엔드 연동을 위한 전역 또는 컨트롤러별 설정)
- [x] **데이터베이스 및 JPA 설정**
  - [x] H2 인메모리 데이터베이스 연동 및 콘솔(`h2-console`) 활성화 확인
  - [x] 스키마를 바탕으로 한 Entity 클래스 작성 (`User`, `Portfolio`, `JobPosting`, `Resume`, `Interview`, `InterviewQa`, `MatchResult`)
  - [x] JSON 타입 컬럼을 처리하기 위한 JPA `@Converter` (AttributeConverter) 구현
- [x] **보안 및 인증 (Spring Security + JWT)**
  - [x] JWT 발급 및 검증 유틸리티 클래스 구현
  - [x] 로그인 API (`/api/auth/login`) 구현 (이메일/비밀번호 검증)
  - [x] Spring Security 필터 체인 구성 및 JWT 인증 필터 등록
  - [x] Role (Admin, Student) 기반 접근 권한 제어 설정
- [x] **공통 에러 처리 및 응답 구조**
  - [x] `GlobalExceptionHandler`를 통한 전역 예외 처리
  - [x] API 공통 응답 포맷 (Success, Error DTO) 정의

## 2. 외부 연동 및 데이터 파싱 로직 (Phase 2)
- [x] **LMS 시스템 연동 (더미 데이터 Mocking)**
  - [x] 실제 API 연동 전 테스트를 위한 Mock Service 클래스 생성
  - [x] 하드코딩된 더미 데이터(학점, 수상, 활동 등)를 반환하는 로직 구현
  - [x] 학생 로그인 시 포트폴리오 자동 갱신 API (`/api/portfolio/lms`) 구현 (Mock 데이터 연동)
- [x] **PDF 파싱 모듈 구현 (Apache PDFBox)**
  - [x] `PDFBox` 라이브러리 의존성 추가 (Phase 1 build.gradle에서 완료)
  - [x] PDF file 업로드 및 텍스트 추출 서비스 구현 (`PdfParsingService`)
  - [x] 추출된 텍스트에서 주요 항목(이력서: 학력/경력, 채용공고: 자격요건 등)을 파싱/분류하는 기본 로직 구현 (AI 연동)

## 3. 핵심 도메인 API 구현 (Phase 3)
- [x] **사용자 및 포트폴리오 관리**
  - [x] 학생 포트폴리오 CRUD API (PDF 업로드 연동 및 AI 구조화 포함)
  - [x] 관리자 및 학생 마이페이지 관련 API (포트폴리오 조회/수정/삭제)
  - [x] **추가 경험 PDF 다중 등록 및 텍스트 자동 추출/관리 기능 구현**
- [x] **채용 공고 (Job Posting)**
  - [x] 관리자 채용공고 등록 API (PDF 파싱 연동 및 AI 구조화 포함)
  - [x] 채용공고 목록 조회 (페이징/필터링) 및 상세 조회 API (학생/관리자 공용)
  - [x] 채용공고 수정 및 삭제 API (관리자 전용)
  - [x] 채용공고 등록 시 회사(Company) 정보 자동 연동 및 생성 로직 구현
- [x] **기업 정보 관리 (Company)**
  - [x] 관리자용 회사 정보 CRUD API (`/api/admin/companies/**`) 구현
  - [x] 기업별 인재상, 조직문화, 면접 유형 등 상세 관리 기반 마련
  - [x] 채용 공고 URL 크롤링(`Jsoup`) 및 AI 분석을 통한 기업 상세 정보 자동 추출 로직 구현
- [x] **AI 비동기 처리 기반 구축**
  - [x] `@EnableAsync` 설정 및 커스텀 스레드 풀(ThreadPoolTaskExecutor) 구성
  - [x] H100 서버(Qwen2.5-32B) 통신을 위한 AI API Client 구현 (LiteLLM/OpenAI 호환 API 연동 완료)

## 4. AI 기반 취업 지원 서비스 구현 (Phase 4)
- [x] **AI 자소서 생성 (Resume)**
  - [x] 자소서 생성 및 수정/삭제 CRUD API 구현
  - [x] 포트폴리오(LMS + PDF 추출 텍스트) + 채용공고 데이터를 결합한 최적화된 프롬프트 작성 및 AI 호출
- [x] **AI 면접 시뮬레이션 (Interview)**
  - [x] 면접 세션 생성 및 초기 질문(공통/AI) 세팅 API (`/api/interview/start`) 구현
  - [x] 텍스트 답변 제출 및 AI 평가(피드백, 점수) API (`/api/interview/answer`) 구현
  - [x] **음성 변환(STT/TTS) 연동 API 구현 (`/api/interview/stt`, `/api/interview/tts`)**
- [x] **취업 매칭 시스템 (Match)**
  - [x] 학생 포트폴리오와 공고 데이터를 기반으로 매칭 점수 산출 로직 구현
  - [x] 사용자 맞춤형 매칭 결과 조회 및 사유 분석 API 구현

## 5. 안정화 및 테스트 (Phase 5)
- [ ] **단위 테스트 및 통합 테스트**
  - [ ] 주요 비즈니스 로직(Service Layer) 단위 테스트 작성 (JUnit, Mockito)
  - [ ] 인증/인가 및 Controller API 통합 테스트 (MockMvc, REST Assured)
- [x] **API 문서화**
  - [x] Swagger(Springdoc) 또는 REST Docs를 이용한 API 명세서 자동화 적용
- [ ] **성능 및 오류 점검**
  - [ ] 비동기 처리(AI 통신) 시 타임아웃 및 재시도(Retry) 로직 검증
  - [ ] N+1 쿼리 문제 점검 및 JPA Fetch Join 최적화
