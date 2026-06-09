# AI 면접 분석 서버 개발 체크리스트

본 체크리스트는 `specification.md`, `interviewer_persona.md`, `harness.md` 문서를 기반으로 AI 서버 개발에 필요한 모든 요구사항을 정리한 문서입니다.

---

## 1. 프로젝트 기획 및 목표

- **핵심 기능 (In-Scope)**
    - [x] LMS 연동 포트폴리오 자동화 (Spring Boot)
    - [x] AI 기반 맞춤형 자소서 변환 (AI)
    - [x] AI 면접 시뮬레이터 (AI) - 기본 흐름 구현 완료
        - [x] 음성/영상 기반 답변 분석 (STT 완료, 비언어적 분석은 더미)
        - [x] 실시간 피드백 및 점수 제공 (LLM 연동 완료)
        - [x] 꼬리 질문 생성 (LLM 연동 완료)
    - [x] 취업처 추천 매칭 시스템 (Spring Boot)

- **정량 목표**
    - [ ] AI 면접 피드백 정확도 85% 이상 달성 (향후 고도화 필요)

---

## 2. AI 서버 핵심 기능 구현 (FastAPI)

### 2.1. API 엔드포인트 (`POST /analyze-and-feedback`)
- [x] FastAPI 애플리케이션 기본 설정 (`main.py`)
- [x] `/analyze-and-feedback` 엔드포인트 생성
- [x] `multipart/form-data` 형식 요청 처리
    - [x] `video_file`: `UploadFile` 타입으로 수신
    - [x] `audio_file`: `UploadFile | None` 타입으로 수신 (선택 사항)
    - [x] `context_data`: `str` (JSON) 타입으로 수신
- [x] Health Check를 위한 `/` 엔드포인트 구현

### 2.2. 데이터 모델 (Pydantic V2)
- [x] `InterviewContext` 모델 정의 (`models.py`)
- [x] `BehaviorAnalysis` 모델 정의 (`models.py`)
- [x] `LLMFeedback` 모델 정의 (`models.py`)
- [x] 최종 응답을 위한 `AnalysisResult` 모델 정의 (`models.py`)

### 2.3. 데이터 처리 흐름 (Orchestration)
- [x] `services.py` 파일에 비즈니스 로직 분리
- [x] `context_data` 문자열을 `InterviewContext` 모델로 파싱 및 유효성 검사
- [x] 수신된 미디어 파일을 임시 디렉토리에 저장 (`temp_media/`)
- [x] `moviepy`를 활용한 오디오 스트림 추출 로직 실구현 (최신 v2.x 문법 적용)
- [x] `asyncio.gather`를 사용한 병렬 분석 태스크 실행
- [x] 분석 완료 후 `try-finally` 블록을 통해 임시 파일 반드시 삭제
- [x] 예상치 못한 서버 오류에 대한 예외 처리 (`main.py`)

---

## 3. AI 분석 모듈

### 3.1. 비언어적/언어적 요소 분석
- [x] **STT (음성 텍스트 변환)**
    - [x] OpenAI Whisper API 연동 (`transcribe_audio_with_whisper`)
    - [x] 비동기(`async`)로 API 호출
- [x] **영상 분석 (Vision Analysis)**
    - [x] `OpenCV`, `MediaPipe Tasks API`를 사용한 시선 처리, 자세 분석 로직 구현
    - [x] `face_landmarker.task`, `pose_landmarker.task` 모델 연동 완료
    - [x] CPU-Bound 작업을 위한 `run_in_executor` 적용
- [x] **음성 특징 분석 (Audio Feature Analysis)**
    - [x] `librosa`를 사용한 말하기 속도(SPM), 음량(dB) 분석 로직 구현

---

## 4. 로컬 STT (Whisper) 전환 완료 (성공)

OpenAI API 유료 결제 이슈를 해결하고 M4 맥북의 성능을 극대화하기 위해 로컬 환경에서 무료 STT를 구동하도록 전환을 완료했습니다.

### 4.1. 환경 구축
- [x] **필수 라이브러리 설치:** `openai-whisper`, `setuptools-rust`, `torch`, `torchaudio`
- [x] **시스템 의존성:** `ffmpeg` 설치 완료 (`brew install ffmpeg`)

### 4.2. 모델 최적화 및 가속
- [x] **모델 사이즈 선정:** `base` 모델 사용 (속도와 정확도의 최적 균형점)
- [x] **M4 하드웨어 가속:** `device="mps"` (Metal Performance Shaders) 옵션을 적용하여 M4 칩의 GPU/Neural Engine 활용 완료

### 4.3. 코드 리팩토링 (`ai_analyzer.py`)
- [x] `AsyncOpenAI` 기반의 STT 호출 로직 제거 및 로컬 호출로 교체
- [x] `whisper.load_model()`을 사용하여 로컬 모델 로드 로직 추가
- [x] 싱글톤(Singleton) 패턴을 적용하여 모델 중복 로드 방지 및 응답 속도 최적화

### 4.4. 검증 및 테스트
- [x] 기존 인터페이스 호환성 유지 (다른 소스 코드 수정 최소화)
- [x] 한국어(`language="ko"`) 고정 설정을 통한 인식률 향상

---

## 5. 코드 구조 및 환경

- [x] `main.py`, `services.py`, `ai_analyzer.py`, `models.py`로 코드 역할 분리
- [x] `requirements.txt`에 필요한 모든 라이브러리 명시
- [x] OpenAI API 키 등 민감 정보 환경 변수 처리 준비 (`.env`)
- [x] `uvicorn`을 사용한 서버 실행 환경 구성
- [x] **서버 안정화 조치 완료**
    - [x] 가상환경 중복 폴더(`venv`) 정리 및 개발 환경 최적화
    - [x] `uvicorn` 무한 재시작 방지를 위한 `temp_media` 무시 및 실행 옵션 최적화

    ---

    ## 5. 서버 API 테스트 가이드 (How to Test)

    구현이 완료된 FastAPI 서버를 실제로 테스트하기 위한 순차적인 방법입니다.

    ### Step 1. 환경 변수(`.env`) 설정
    - 프로젝트 루트 디렉토리에 `.env` 파일을 생성합니다.
    - STT 처리를 위한 OpenAI API 키와, 피드백 생성을 위한 LLM API 키를 입력합니다.
    ```env
    OPENAI_API_KEY="sk-your-openai-api-key"
    LLM_BASE_URL="http://your-h100-server-url/v1" # 학과 서버 미사용 시 생략 가능
    LLM_API_KEY="your-llm-api-key"
    ```

    ### Step 2. 테스트용 미디어 파일 준비
    - 테스트에 사용할 짧은 영상 파일(예: `test_video.mp4`)을 준비합니다. 가급적 얼굴이 잘 나오고 목소리가 포함된 10~20초 분량의 파일이 좋습니다.

    ### Step 3. FastAPI 서버 실행
    - 터미널에서 가상환경을 활성화한 후 아래 명령어로 서버를 실행합니다. (재시작 방지 옵션 포함)
    ```bash
    uvicorn main:app --reload --reload-dir . --reload-exclude ".venv" --reload-exclude "temp_media"
    ```

    ### Step 4. Swagger UI 접속 및 API 호출
    1. 웹 브라우저를 열고 `http://127.0.0.1:8000/docs` 에 접속합니다.
    2. `POST /analyze-and-feedback` 엔드포인트를 클릭하고 **Try it out** 버튼을 누릅니다.
    3. 데이터 입력:
    - **video_file**: Step 2에서 준비한 `test_video.mp4` 파일을 업로드합니다.
    - **audio_file**: (선택 사항) 비워두면 영상에서 자동으로 오디오를 추출합니다.
    - **context_data**: 아래와 같은 JSON 문자열을 그대로 복사하여 붙여넣습니다.
      ```json
      {
        "interview_type": "technical",
        "current_question": "Spring Boot의 장점에 대해 설명해주세요.",
        "student_portfolio": "Java 웹 개발 경험이 있는 4학년 학생입니다.",
        "company_info": "도전적이고 자기 주도적인 인재를 원합니다."
      }
      ```
    4. **Execute** 버튼을 눌러 요청을 전송합니다.

    ### Step 5. 응답 검증 (성공 기준)
    - **Status Code:** `200 OK`가 반환되어야 합니다.
    - **Response Body:** 다음과 같은 형태의 JSON이 반환되는지 확인합니다.
    - `behavior_analysis`: MediaPipe와 Librosa에 의해 분석된 숫자들 (`eye_contact_issues`, `posture_issues`, `speech_rate_spm`, `volume_db`)이 0이 아닌 실제 분석된 값으로 나와야 합니다.
    - `feedback`: LLM이 생성한 한국어 피드백 문자열이 존재해야 합니다.
    - `score`: 0~100 사이의 정수 점수가 나와야 합니다.
    - `next_question`: 이전 답변을 기반으로 한 한국어 꼬리 질문이 존재해야 합니다.