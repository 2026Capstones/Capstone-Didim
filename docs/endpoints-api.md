# API Endpoints Documentation

이 문서는 **Didim** 프로젝트의 백엔드(Spring Boot), AI 서버(FastAPI), 그리고 프론트엔드에서 참조하는 모든 API 엔드포인트를 정리한 문서입니다.

---

## 1. Back-end API (Spring Boot)

**Base URL:** `http://localhost:8080` (기본값)

### 🔐 인증 (Auth)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | 로그인 및 JWT 토큰 발급 |

**테스트용 계정 (Dummy Data):**
- **관리자 계정:** `admin@didim.com` / `password`
- **학생 계정:** `student@didim.com` / `password`

### 🏢 채용 공고 관리 (Job Posting - Admin)
| Method | Endpoint | Description           |
| :--- | :--- |:----------------------|
| `POST` | `/api/admin/job-posting/upload` | 채용 공고 대량 업로드 (pdf 형식) |
| `GET` | `/api/admin/job-posting` | 모든 채용 공고 목록 조회        |
| `PUT` | `/api/admin/job-posting/{id}` | 특정 채용 공고 수정           |
| `DELETE` | `/api/admin/job-posting/{id}` | 특정 채용 공고 삭제           |

### 🏢 기업 관리 (Company - Admin)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/companies` | 등록된 모든 기업 목록 조회 |
| `GET` | `/api/admin/companies/{id}` | 특정 기업 상세 정보 조회 |
| `PUT` | `/api/admin/companies/{id}` | 기업 정보 수정 |
| `DELETE` | `/api/admin/companies/{id}` | 기업 정보 삭제 |

### 🎤 AI 면접 (Interview)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/interview/start/{jobId}` | 면접 세션 시작 및 첫 질문 생성 |
| `GET` | `/api/interview/list` | 내 면접 이력 목록 조회 |
| `POST` | `/api/interview/answer/{interviewId}` | 사용자의 텍스트 답변 제출 및 평가/다음 질문 생성 |
| `POST` | `/api/interview/tts` | 텍스트를 음성(Audio)으로 변환 |
| `POST` | `/api/interview/stt` | (비활성화) 음성을 텍스트로 변환 |

### 🔍 채용 공고 조회 (Job Postings - User)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/job-postings` | 채용 공고 목록 조회 (필터링 포함) |
| `GET` | `/api/job-postings/{id}` | 특정 채용 공고 상세 조회 |

### ⚖️ 매칭 (Match)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/match/calculate/{jobId}` | 내 스펙과 공고 간의 매칭률 계산 |

### 📁 포트폴리오 (Portfolio)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/portfolio/lms` | LMS 데이터 연동 |
| `GET` | `/api/portfolio` | 내 포트폴리오 요약/목록 조회 |
| `PUT` | `/api/portfolio` | 포트폴리오 정보 수정 |
| `DELETE` | `/api/portfolio` | 포트폴리오 정보 삭제 |
| `POST` | `/api/portfolio/upload` | 포트폴리오 파일 업로드 |
| `GET` | `/api/portfolio/ai-health` | AI 분석 서버 상태 확인 |
| `POST` | `/api/portfolio/upload-additional` | 추가 증빙 자료 업로드 |
| `DELETE` | `/api/portfolio/additional` | 추가 증빙 자료 삭제 |

### 📝 자기소개서 (Resume)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/resume/generate/{jobId}` | AI 기반 자기소개서 자동 생성 |
| `GET` | `/api/resume/{jobId}` | 특정 채용 공고용으로 생성된 자기소개서 상세 조회 |
| `GET` | `/api/resume/list` | 내 자기소개서 목록 조회 |
| `PUT` | `/api/resume/{jobId}` | 자기소개서 내용 수정 |
| `DELETE` | `/api/resume/{jobId}` | 자기소개서 삭제 |

---

## 2. AI Server API (FastAPI)

**Base URL:** `http://127.0.0.1:8000`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/analyze-and-feedback` | 영상/음성 답변 분석, 피드백 및 다음 질문 생성 |
| `GET` | `/` | 서버 상태 확인 (Health Check) |

---

## 3. Front-end 참조 API (React)

프론트엔드 소스 코드에서 실제로 호출하고 있는 API 엔드포인트 목록입니다. 백엔드 컨트롤러와 매칭을 확인 완료했습니다.

| 분류 | 메서드 | 경로 | 사용 페이지 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **인증** | `POST` | `/api/auth/login` | `LoginPage.tsx` | JWT 로그인 |
| **관리자** | `GET` | `/api/admin/job-posting` | `AdminPage.tsx` | 공고 목록 조회 |
| **관리자** | `POST` | `/api/admin/job-posting/upload` | `AdminPage.tsx` | PDF 대량 업로드 |
| **관리자** | `DELETE` | `/api/admin/job-posting/{id}` | `AdminPage.tsx` | 공고 삭제 |
| **자소서** | `POST` | `/api/resume/generate/{jobId}` | `CoverLetterPage.tsx` | AI 자소서 생성 |
| **공고** | `GET` | `/api/job-postings` | `InterviewPage.tsx`, `JobPostingsPage.tsx` | 공고 목록 조회 |
| **면접** | `POST` | `/api/interview/start/{jobId}` | `InterviewPage.tsx` | 면접 시작 |
| **면접** | `POST` | `/api/interview/answer/{interviewId}` | `InterviewPage.tsx` | 답변 제출 |
| **매칭** | `POST` | `/api/match/calculate/{jobId}` | `JobPostingsPage.tsx` | 매칭률 계산 |
| **포트폴리오** | `GET` | `/api/portfolio` | `PortfolioPage.tsx` | 목록 조회 |
| **포트폴리오** | `PUT` | `/api/portfolio` | `PortfolioPage.tsx` | 정보 수정 |
| **포트폴리오** | `POST` | `/api/portfolio/lms` | `PortfolioPage.tsx` | LMS 데이터 동기화 |
| **포트폴리오** | `POST` | `/api/portfolio/upload` | `PortfolioPage.tsx` | 파일 업로드 분석 |

---

## 💡 참고 사항
- 백엔드 서버는 `8080` 포트를 사용하며, AI 서버는 `8000` 포트를 사용합니다.
- 현재 프론트엔드의 일부 기능은 `localStorage` 및 `mocks` 데이터를 사용 중입니다.
- AI 서버 연동을 위한 상세 설정은 `application-prod.yml` 파일의 `spring.ai.openai` 설정을 참조하십시오.
