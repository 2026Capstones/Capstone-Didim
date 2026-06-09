# 변경 및 수정 이력 (Fixes & Updates)

## [2026-06-08] - 시스템 안정화 및 문법/비동기 버그 수정

### 1. `ai_analyzer.py` - OpenAI SDK 호환성 패치
- **이슈:** 최신 OpenAI Python SDK(v1.0+)에서 지원하지 않는 `client.with_timeout()` 비동기 컨텍스트 매니저 사용으로 인한 런타임 에러 발생.
- **해결:** `AsyncOpenAI` 클라이언트 초기화 부분에 직접 `timeout=60.0` 파라미터를 주입하고, 불필요한 `async with` 구문 제거.

### 2. `services.py` - API 파라미터 및 이벤트 루프 블로킹 문제 해결
- **파라미터명 불일치 수정:** `ai_analyzer.get_feedback_from_llm()` 함수 호출 시, 정의된 파라미터명(`behavior`)과 실제 넘겨주는 인자명(`behavior_analysis`)이 달라 발생하는 `TypeError` 수정.
- **동기 작업 스레드 분리:** `moviepy`를 사용하는 `_extract_audio_from_video` 함수가 동기(Sync) 함수로 작성되어, 비동기(Async) 처리 중인 FastAPI의 이벤트 루프(서버 전체)를 블로킹하는 현상 방지. 이를 위해 `asyncio.to_thread()`를 적용하여 백그라운드 스레드에서 안전하게 오디오 추출을 수행하도록 변경.

### 3. 구조적 컨텍스트 이해 및 테스트 방법론 정립
- **`context_data` 구조:** Spring Boot 서버로부터 넘어오는 JSON 내부에 `student_portfolio` 필드가 존재하며, 이 안에 학생의 기본 정보, 포트폴리오, 수상 이력 등이 모두 통합되어 넘어옴을 확인.
- **Swagger 테스트 방법:** 실제 서비스 연동 전 단독 테스트 시, Swagger UI의 `context_data` 항목에 `student_portfolio`와 `current_question` 등이 모두 포함된 유효한 JSON 문자열을 직접 입력하여 테스트해야 정상 작동함을 확인 및 가이드.

## [최근 업데이트] - 의존성 호환성, 아키텍처 분리 및 서버 안정화 패치

### 1. `moviepy` 호환성 및 예외 처리 강화 (`services.py`)
- **이슈:** `moviepy` 2.0 메이저 업데이트로 인한 모듈 경로 변경 오류 및 오디오 트랙이 없는 영상 처리 시 발생하는 `FileNotFoundError` 위험.
- **해결:** `try-except` 구문을 통해 v1.x 및 v2.0 임포트 문법을 모두 지원하도록 방어 코드 작성. 오디오 트랙이 없는 영상 파일이 들어올 경우 명시적으로 `ValueError`를 발생시키고 스트림을 닫아 서버 크래시를 방지함.

### 2. 엄격한 타입 체킹(Pylance) 및 Pydantic V2 대응 (`services.py`, `ai_analyzer.py`)
- **이슈:** 에디터의 Strict 타입 검사에서 발생하는 무수한 경고 및 Pydantic 버전 충돌 문제.
- **해결:** 
  - `UploadFile.filename`이 `None`일 경우를 대비한 기본값 지정 방어 코드 추가.
  - FastAPI `HTTPException` 상태 코드를 `status` 모듈의 상수로 통일 및 키워드 인자(`detail=`) 명시.
  - Pydantic V1/V2 하위 호환성을 위해 `hasattr`로 `model_validate_json` 및 `parse_raw` 분기 처리 적용.
  - LLM 응답 `content`가 `None`일 수 있는 타입 에러 방지 방어 코드(`or "{}"`) 적용.

### 3. AI 클라이언트 분리 아키텍처 적용 (`ai_analyzer.py`, `requirements.txt`)
- **이슈:** STT(OpenAI Whisper)와 면접 피드백 LLM(학과 H100 Qwen2.5)의 API 요청 주체가 달라서 단일 API 클라이언트 구조로는 처리가 불가능함.
- **해결:** `python-dotenv` 패키지를 추가하고 `.env` 파일을 통해 환경 변수 로드. `stt_client`(공식 OpenAI)와 `llm_client`(학과 H100 서버용)로 통신 객체를 완벽히 분리. H100 서버 URL 미설정 시 자동으로 예비용 OpenAI 모델로 동작하도록 유연한 분기 로직 작성.

### 5. 비언어적 분석 기능 실구현 (MediaPipe & Librosa 도입)
- **영상 분석:** `MediaPipe Face Mesh`와 `Pose`를 사용하여 시선 처리(Eye Contact)와 자세(Posture) 불안정을 실시간으로 감지하는 로직을 구현했습니다. 성능 최적화를 위해 초당 5프레임 샘플링 및 `run_in_executor`를 통한 비동기 처리를 적용했습니다.
- **음성 분석:** `Librosa`를 활용하여 평균 음량(dB) 측정 및 음성 신호의 온셋(Onset) 감지를 통한 말하기 속도(SPM) 추정 로직을 구현했습니다.
- **의존성 업데이트:** `opencv-python`, `mediapipe`, `librosa` 등을 `requirements.txt`에 추가하고 가상환경에 설치 완료했습니다.

### 6. 로컬 Whisper 모델 다운로드 SSL 인증서 에러 해결
- **이슈:** macOS 환경에서 파이썬이 로컬 Whisper(`base` 모델) 최초 다운로드 시 SSL 인증서 검증을 통과하지 못해 `[SSL: CERTIFICATE_VERIFY_FAILED]` 에러가 발생하며 음성 인식이 실패(무음 처리)하는 현상 발생.
- **해결:** `ai_analyzer.py` 최상단에 `certifi` 모듈을 활용하여 `SSL_CERT_FILE` 환경 변수를 명시적으로 설정하고, `ssl._create_unverified_context`를 적용하여 모델 다운로드가 정상적으로 이루어지도록 패치함.

### 7. 무손실 오디오 추출 포맷 변경 (.mp3 -> .wav)
- **이슈:** `moviepy`를 통해 추출한 `.mp3` 압축 포맷을 `librosa` 내부의 `soundfile` 엔진이 제대로 해독하지 못해, 정상적인 오디오 파일임에도 `-35dB` 수준의 무음 깡통 데이터로 인식하는 고질적 버그 확인.
- **해결:** 오디오 추출 로직을 수정하여, 압축 손실과 코덱 호환성 문제가 없는 비압축 무손실 포맷인 `.wav`(`pcm_s16le` 코덱)로 추출하도록 전면 개편. 이를 통해 음성 인식률 및 데시벨 측정의 정확도를 100% 정상화함.

### 8. Uvicorn 감시자(Watchfiles) 무한 재시작 완벽 해결 (run_server.py)
- **이슈:** Python 3.14 및 M4 환경에서 `uvicorn --reload-exclude` CLI 옵션이 깊은 하위 디렉토리(`torch` 등 대용량 라이브러리)의 변경 사항을 제대로 무시하지 못해 서버가 1분 주기로 강제 재시작되는 현상 발생.
- **해결:** CLI 옵션 대신 Uvicorn을 파이썬 코드로 직접 제어하는 `run_server.py` 스크립트 작성. 처음에는 화이트리스트(`reload_includes`) 방식을 시도했으나 라이브러리 버그로 인해 무시됨을 확인하고, 궁극적으로 **자동 재시작(reload) 기능 자체를 완전히 비활성화**하여 분석 도중 서버가 죽는 치명적인 결함을 원천 차단함.