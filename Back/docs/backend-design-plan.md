# 백엔드 설계 계획 (Backend Design Plan)

## 1. 개요 및 기술 스택
- **프레임워크:** Spring Boot
- **언어:** Java
- **데이터베이스:** H2 (초기 테스트용) / 추후 MySQL 전환 예정
- **보안:** Spring Security + JWT
- **PDF 처리:** Apache PDFBox (서버 내장 직접 파싱)
- **비동기 처리:** Spring `@Async` + HTTP Polling

## 2. 패키지 및 아키텍처 구조 (Layered Architecture)
`com.capstone.back`
├── `config/` : Security, Async, JWT, Swagger(API 명세), CORS, H2 Console 등 설정
├── `controller/` : REST API 엔드포인트
├── `service/` : 비즈니스 로직, AI 연동, LMS 외부 통신 로직(초기엔 Mock 연동)
├── `repository/` : Spring Data JPA 인터페이스
├── `domain/` : 엔티티 (User, Portfolio, JobPosting, Resume, Interview, MatchResult 등)
├── `dto/` : Request/Response 데이터 전송 객체
└── `exception/` : 전역 예외 처리 (GlobalExceptionHandler)

## 3. 핵심 비즈니스 로직 설계
### 3.1. 사용자 및 인증 (Auth)
- `POST /api/auth/login`: 아이디/비밀번호 검증 후 JWT 토큰 발급.
- Role(Admin/Student) 기반의 엔드포인트 접근 제어 (Spring Security 적용).

### 3.2. 포트폴리오 (Portfolio)
- `GET /api/portfolio/lms`: 학교 LMS API 연동을 대체하여 **더미 데이터(Mock)**를 반환하는 서비스로 학생의 수강, 학점, 활동 내역 자동 수집 테스트 수행.
- `POST /api/portfolio/pdf`: 이력서/포트폴리오 PDF를 업로드받아 서버 내장 `PDFBox`로 텍스트 추출. 이후 AI 서버를 거쳐 구조화된 데이터(JSON)로 변환해 DB 저장.
- 학생 본인의 포트폴리오 데이터 CRUD API 구현.

### 3.3. 채용 공고 (Job Posting)
- `POST /api/admin/jobs`: 관리자가 채용공고 PDF 업로드. 서버에서 파싱 및 AI 정보 추출(기업명, 직무, 자격요건, 우대사항 등) 수행 후 DB 저장.
- `GET /api/jobs`: 학생이 볼 수 있는 전체 채용공고 조회 및 필터링 기능.

### 3.4. AI 자소서 생성 (Resume)
- `POST /api/resume/generate`: 학생이 특정 Job ID(공고)를 선택해 자소서 생성 요청.
  - 내부 로직: `@Async`를 활용해 백그라운드 스레드에서 H100 AI 서버로 포트폴리오+공고 텍스트 결합 프롬프트 전송.
  - 응답: 작업 접수 완료 상태 및 `taskId` 반환.
- `GET /api/resume/status/{taskId}`: 프론트엔드에서 Polling 방식으로 작업 완료 여부 및 생성된 자소서 결과를 주기적으로 조회.

### 3.5. AI 면접 시뮬레이션 (Interview)
- `POST /api/interview/start`: 선택한 공고 및 직무를 바탕으로 면접 세션(Interview 엔티티) 생성. AI 또는 DB를 통해 공통/직무 질문을 생성.
- `POST /api/interview/answer`: 학생의 텍스트 답변 제출 시, AI 서버를 호출해 피드백과 점수를 반환받아 DB에 갱신 (STT/TTS는 프론트엔드 레벨에서 텍스트로 변환해 통신).

### 3.6. 취업 매칭 (Match)
- `GET /api/match/recommend`: 학생 포트폴리오 역량과 공고 자격요건을 AI 또는 룰베이스 엔진을 통해 비교 분석. 매칭 점수를 산출하고 내림차순으로 추천 기업 리스트 응답.

## 4. 데이터베이스 및 엔티티 매핑 전략
- 제공된 `didim_database_v2.sql`의 스키마를 기준으로 JPA 엔티티 작성. (H2 방언에 맞게 호환성 유지)
- JSON 타입 필드(awards, resume_questions 등)는 JPA `@Converter`(AttributeConverter)를 활용해 Java의 List 또는 커스텀 객체로 변환.

## 5. 단계별 구현 마일스톤
- **1단계 (기본 세팅 및 인증):** Spring Boot 초기 설정, H2 DB 연동, JWT 인증, 기초 엔티티 매핑
- **2단계 (핵심 연동 및 파싱):** LMS 더미 데이터 연동(Mock), PDF 업로드 및 파싱(PDFBox) 기능 적용
- **3단계 (AI 비동기 통합):** 자소서 생성 비동기 처리 파이프라인(`@Async` + Polling) 및 면접 질문/평가 기능 구현
- **4단계 (매칭 및 고도화):** 취업 매칭 점수 산출 로직 구현, 예외 처리 세분화 및 성능 최적화
