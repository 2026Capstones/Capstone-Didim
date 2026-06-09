# 🚀 Front - Back - AI 엔드포인트 통합 및 완성 가이드

이 체크리스트는 프론트엔드, 백엔드(Spring Boot), 그리고 AI 서버(FastAPI)를 하나로 연결하여 **AI 면접 서비스**를 완성하기 위한 단계별 실행 계획입니다.

---

## 1단계: API 경로 및 명세 동기화 (Alignment)
프론트엔드와 백엔드 간의 불일치하는 엔드포인트를 먼저 맞춥니다.

- [x] **더미 계정 테스트:** 백엔드 `data.sql`에 정의된 계정(`admin@didim.com`, `student@didim.com` / 비밀번호: `password`)으로 로그인이 정상적으로 수행되는지 확인.
- [x] **백엔드 엔드포인트 확인:** `InterviewController`의 `/api/interview/answer/{interviewId}` 경로 확인.
- [x] **프론트엔드 경로 수정:** `InterviewPage.tsx`의 `INTERVIEW_ANSWER_ENDPOINT`를 `/api/interview/answer` 계열로 수정 (현재 `/api/interviews/answers`).
- [x] **데이터 포맷 확정:** 
    - 백엔드는 현재 `String answer`를 받지만, 프론트엔드는 `FormData`(영상/음성 파일)를 전송함.
    - 백엔드 컨트롤러가 `MultipartFile`을 받도록 수정하거나, AI 서버로 직접 전달하는 구조 확정.

## 🔍 API 엔드포인트 코드-문서 불일치 및 미구현 항목 (Cross-Check)
백엔드에는 구현되어 있으나 프론트엔드에서 아직 Mock 데이터를 사용하거나 누락된 항목들입니다.

- [x] **자기소개서 관리 연동:** 
    - [x] `MyCoverLettersPage.tsx`: `GET /api/resume/list` 연동 (현재 Mock 데이터 사용 안함)
    - [x] `CoverLetterPage.tsx`: `GET /api/resume/{jobId}` 연동 (현재 Mock 데이터 사용 안함)
    - [x] `CoverLetterPage.tsx`: `PUT /api/resume/{jobId}` 연동 (수정 사항 서버 저장)
    - [ ] `CoverLetterPage.tsx`: `DELETE /api/resume/{jobId}` 연동 (UI 미구현)
- [ ] **관리자 기능 확장:**
    - [x] `AdminPage.tsx`: `GET /api/admin/job-posting` 연동
    - [x] `AdminPage.tsx`: `POST /api/admin/job-posting/upload` 연동
    - [x] `AdminPage.tsx`: `DELETE /api/admin/job-posting/{id}` 연동
    - [ ] `AdminPage.tsx`: `PUT /api/admin/job-posting/{id}` (공고 수정 기능 미구현)
    - [ ] `AdminPage.tsx`: `GET /api/admin/companies` (기업 관리 페이지 미구현)
- [x] **면접 답변 데이터 타입:**
    - [x] `InterviewController.java`: `submitAnswer`의 `@RequestParam` 명칭(`audioFile`, `videoFile`)이 프론트엔드의 `FormData` key값과 일치하는지 최종 확인 (일치).
- [x] **면접 이력 조회 연동:**
    - [x] `InterviewPage.tsx`: `GET /api/interview/list` 연동 및 결과 매핑.

## 2단계: 백엔드 - AI 서버 통신 구현 (Back to AI)
Spring Boot에서 FastAPI로 분석 요청을 보내는 로직을 완성합니다.

- [x] **AI 서버 URL 설정:** `application.properties` 또는 `yml`에 `ai.server.url=http://localhost:8000` 등록.
- [x] **RestTemplate/WebClient 구현:** Spring Boot에서 AI 서버의 `/analyze-and-feedback`으로 `MultipartFile`과 컨텍스트를 전달하는 로직 작성.
- [x] **DTO 매핑:** AI 서버의 반환값(`AnalysisResult`)을 백엔드 `InterviewResponse`로 변환하는 매퍼 작성.

## 3단계: 미디어 데이터 흐름 완성 (Media Flow)
영상과 음성 데이터를 처리하는 엔드-투-엔드 흐름을 연결합니다.

- [x] **파일 저장 전략:** 프론트에서 받은 파일을 백엔드 임시 디렉토리에 저장할지, 즉시 AI 서버로 스트리밍할지 결정.
- [x] **STT/TTS 연동:** 
    - AI 서버에서 STT를 처리한다면 백엔드는 중계 역할만 수행.
    - 백엔드의 `/api/interview/tts`가 실제 AI 서버나 OpenAI API를 호출하도록 연결.

## 4단계: 프론트엔드 실데이터 연동 (Front to Back)
Mock 데이터를 제거하고 실제 백엔드 API를 호출하도록 변경합니다.

- [x] **인증 처리:** 모든 API 요청 헤더에 JWT 토큰(`Authorization: Bearer ...`) 포함 확인.
- [x] **면접 시작 연동:** `startInterviewRecording` 호출 전, 백엔드의 `/api/interview/start/{jobId}`를 호출하여 `interviewId`를 먼저 획득.
- [x] **답변 제출 연동:** 녹화 종료 시 `finishInterviewRecording`에서 백엔드의 `/api/interview/answer/{interviewId}`로 `FormData` 전송.
- [x] **피드백 결과 반영:** AI 분석 결과로 받은 점수와 피드백을 UI(`InterviewPage.tsx`의 피드백 카드)에 렌더링.

## 5단계: 전체 테스트 및 예외 처리 (Testing & QA)
- [x] **로그인 세션 만료 처리:** 토큰 만료 시 로그인 페이지로 리다이렉트.
- [x] **파일 용량 제한 테스트:** 10MB 이상의 대용량 파일 전송 시 에러 핸들링.
- [x] **AI 서버 타임아웃 처리:** 분석이 길어질 경우 프론트엔드에서 로딩 상태(Spinner) 표시.
- [x] **데이터 정합성 확인:** DB(MySQL/H2)에 면접 질문과 사용자의 분석 결과가 정확히 저장되는지 확인.

---

## 💡 최종 통합 시퀀스 (Summary)
1. **Front:** 면접 시작 버튼 클릭 -> `/api/interview/start` (Back 호출)
2. **Back:** 면접 세션 생성 및 첫 질문 반환 -> **Front:** 질문 출력 및 녹화 시작
3. **Front:** 답변 종료 -> `/api/interview/answer` (Back으로 영상/음성 파일 전송)
4. **Back:** 파일을 AI 서버 `/analyze-and-feedback`으로 전달
5. **AI Server:** 분석 후 결과(점수, 피드백, 다음 질문) 반환 -> **Back**
6. **Back:** 분석 결과 DB 저장 후 **Front**로 응답
7. **Front:** 받은 피드백 UI 출력 및 다음 질문 준비
