# Python AI 서버 설계 계획서 (FastAPI)

본 문서는 Spring Boot 메인 서버로부터 미디어 데이터(영상/음성)와 면접 컨텍스트를 받아, AI 기반 분석 및 피드백을 생성하는 Python FastAPI 서버의 상세 설계안을 정의합니다. `specification.md`의 요구사항과 `interviewer_persona.md`의 AI 페르소나 정의를 기반으로 작성되었습니다.

---

## 1. 개요 및 역할

Python AI 서버는 아키텍처의 '두뇌' 역할을 수행합니다. Spring Boot로부터 전달받은 개별 질문에 대한 사용자의 답변(영상/음성)을 실시간으로 분석하고, 사용자의 자기소개서 및 면접 맥락을 종합하여 심층적인 피드백과 다음 꼬리 질문을 생성하는 책임을 가집니다.

- **Input:** `video_file`, `audio_file`, `context_data` (JSON)
- **Output:** `behavior_analysis`, `feedback`, `score`, `next_question` (JSON)
- **핵심 기술:** FastAPI, 비동기 처리, STT, Computer Vision, LLM 연동

---

## 2. 핵심 처리 흐름 (Core Processing Flow)

`POST /analyze-and-feedback` 엔드포인트 요청 수신 시, 아래와 같은 단계로 처리가 진행됩니다. FastAPI의 비동기(async) 특성을 활용하여 I/O 바운드 작업들을 병렬 처리함으로써 응답 시간을 최적화합니다.

### Step 1: 요청 수신 및 데이터 전처리
1.  **API 요청 수신:** `multipart/form-data` 형식으로 `video_file`, `audio_file`, `context_data`를 받습니다.
2.  **컨텍스트 파싱:** `context_data` (JSON 문자열)를 Python 딕셔너리로 파싱합니다. 이 데이터에는 `interview_type`, `current_question`, `student_portfolio`(자기소개서/LMS 데이터), `company_info` 등이 포함됩니다.
3.  **미디어 파일 저장:** 수신된 미디어 파일을 임시 디렉토리에 저장하여 후속 분석 단계에서 사용할 수 있도록 준비합니다. 만약 `audio_file`이 제공되지 않았다면, `video_file`에서 오디오 스트림을 추출하여 별도 파일로 저장합니다. (e.g., `moviepy` 라이브러리 활용)

### Step 2: 비언어적/언어적 요소 병렬 분석 (Concurrent Analysis)
`asyncio.gather`를 사용하여 음성 분석, 영상 분석, STT 변환을 동시에 실행합니다.

#### 2.1. 음성 분석 (Voice Analysis)
- **목표:** 답변 내용 외적인 음성적 특징을 추출합니다.
- **분석 항목:**
    - **말하기 속도 (Speech Rate):** STT 결과 텍스트의 음절 수와 전체 음성 길이를 기반으로 분당 음절 수(SPM)를 계산합니다. (`speech_rate_spm`)
    - **음량 (Volume/Decibels):** 음성 파일의 평균 데시벨을 측정하여 목소리 크기의 적절성을 평가합니다. (`volume_db`)
- **사용 라이브러리:** `librosa`, `pydub` 등

#### 2.2. 영상 분석 (Vision Analysis)
- **목표:** 시각적인 태도와 습관을 분석합니다.
- **분석 항목:**
    - **시선 처리 (Eye Contact):** 얼굴 랜드마크를 탐지하여 시선이 정면을 향하는 비율과 불안정한 움직임(예: 두리번거림)의 빈도를 측정합니다. (`eye_contact_issues`)
    - **자세 (Posture):** 머리 기울기, 어깨선 등을 분석하여 불안정한 자세나 과도한 움직임을 감지합니다. (`posture_issues`)
- **사용 라이브러리:** `OpenCV`, `MediaPipe`

#### 2.3. 음성-텍스트 변환 (STT: Speech-to-Text)
- **목표:** 사용자의 음성 답변을 텍스트로 변환합니다.
- **프로세스:** 임시 저장된 오디오 파일을 STT 모델(예: OpenAI Whisper)에 전달하여 텍스트(`student_answer`)를 추출합니다.

### Step 3: LLM 프롬프트 생성 및 호출
1.  **정보 취합:** 이전 단계에서 얻은 모든 정보를 종합합니다.
    - **면접관 페르소나:** `context_data['interview_type']`에 따라 `interviewer_persona.md`에 정의된 역할(기술 면접관, 인성 면접관 등)을 지정합니다.
    - **면접 맥락:** `student_portfolio`(자기소개서), `company_info`, `current_question`
    - **사용자 답변:** STT로 변환된 `student_answer` 텍스트
    - **행동 분석 결과:** `behavior_analysis` (시선 처리, 말하기 속도 등)

2.  **프롬프트 구조화:** LLM(Qwen2.5-32B)이 명확하게 역할을 인지하고 지시사항을 수행할 수 있도록 구조화된 프롬프트를 생성합니다.

    ```prompt
    # Role
    당신은 [${interview_type}] 면접관입니다. [interviewer_persona.md]에 정의된 어투와 역할을 엄격히 준수하십시오.

    # Context
    - 지원자 정보 (자기소개서/포트폴리오): ${student_portfolio}
    - 회사 정보: ${company_info}
    - 현재 질문: ${current_question}

    # Applicant's Response & Behavior
    - 답변 내용 (STT): "${student_answer}"
    - 비언어적 태도: 시선 처리가 ${eye_contact_issues}회 불안정했으며, 말하기 속도는 ${speech_rate_spm} SPM으로 다소 빠른 편입니다. 자세 또한 ${posture_issues}회 불안정한 모습이 보였습니다.

    # Instruction
    위 모든 정보를 종합하여, 다음 3가지 항목을 JSON 형식으로 생성해주십시오.
    1.  feedback: 답변 내용의 강점과 보완점, 그리고 비언어적 태도에 대한 전문가적 조언을 구체적으로 작성하십시오.
    2.  score: 답변의 논리성, 구체성, 직무 연관성, 태도 등을 종합하여 0점에서 100점 사이의 점수를 산출하십시오.
    3.  next_question: 위 답변 내용과 지원자 정보를 바탕으로, 지원자의 역량을 더 깊이 파악할 수 있는 날카로운 꼬리 질문을 하나 생성하십시오.
    ```

3.  **LLM API 호출:** 생성된 프롬프트를 `openai` SDK 호환 API를 통해 LLM에 전송하고, JSON 형식의 응답을 수신합니다.

### Step 4: 최종 응답 구성 및 반환
1.  **결과 통합:** LLM으로부터 받은 `feedback`, `score`, `next_question`과 Step 2에서 분석한 `behavior_analysis` 결과를 하나의 JSON 객체로 통합합니다. 최종 응답 객체에는 `status` 필드를 추가하여 처리 성공 여부를 명시합니다.
    ```json
    {
      "status": "SUCCESS",
      "behavior_analysis": { ... },
      "feedback": "...",
      "score": 85,
      "next_question": "..."
    }
    ```
2.  **응답 반환:** `README.md`에 명시된 최종 응답 형식에 맞춰 Spring Boot 서버로 HTTP 200 OK와 함께 통합된 JSON 데이터를 반환합니다.

---

## 3. 기술 스택 및 주요 라이브러리

| 구분 | 기술 / 라이브러리 | 목적 |
|---|---|---|
| **Web Framework** | `FastAPI` | 비동기 API 서버 구축 |
| **Media Handling** | `python-multipart` | Form 데이터 처리 |
| | `MoviePy` | 비디오에서 무손실 오디오(`.wav`) 스트림 추출 |
| **STT** | `openai-whisper`, `torch` | 로컬 음성-텍스트 변환 (M4 MPS 하드웨어 가속) |
| **Audio Analysis** | `librosa` | 오디오 특성(빠르기, 음량) 분석 |
| **Vision Analysis**| `OpenCV-Python`, `MediaPipe Tasks API` | 얼굴/자세 랜드마크 탐지 및 분석 |
| **LLM** | `openai` | Qwen2.5-32B (SDK 호환) 모델 연동 |

---

## 4. 비동기 처리 및 성능 고려사항

- **비동기 엔드포인트:** 모든 API 엔드포인트는 `async def`로 정의하여 논블로킹(Non-blocking) I/O를 보장합니다.
- **병렬 실행:** 영상 분석, 음성 분석과 같이 병목이 발생하는 작업들은 `asyncio.gather`를 통해 동시에 실행하여 대기 시간을 최소화합니다.
- **CPU/GPU-Bound 작업 처리:** `MediaPipe`를 사용한 영상 분석이나 로컬 `Whisper` 모델 추론과 같이 연산량이 높은 작업은 FastAPI의 `run_in_executor`(또는 `asyncio.to_thread`)를 사용하여 메인 이벤트 루프가 블로킹되는 것을 방지하고, 전체적인 서버 응답성을 유지합니다.

---

## 5. 기술적 어필 포인트 (Technical Selling Points)

포트폴리오나 기술 면접에서 강력하게 어필할 수 있는 본 프로젝트만의 아키텍처 및 트러블슈팅 경험입니다.

1. **클라우드 종속성 탈피 및 Zero-Cost STT 파이프라인 구축**
   - 초기 OpenAI Whisper API 연동에서 발생하는 쿼터 제한(HTTP 429) 및 비용 문제를 해결하기 위해, 로컬 Whisper 모델 기반의 파이프라인으로 전면 리팩토링했습니다. 이를 통해 서비스 확장 시 발생하는 STT 처리 비용을 0원으로 만들고 데이터 보안을 강화했습니다.
2. **Apple Silicon (M4) 하드웨어 가속(MPS) 및 싱글톤 패턴 적용**
   - 로컬 AI 모델 구동 시 발생하는 추론 지연(Latency)을 최소화하기 위해 PyTorch의 `device="mps"` 옵션을 적용하여 M4 칩의 Neural Engine/GPU 가속을 100% 이끌어냈습니다.
   - 무거운 AI 모델 객체를 매 요청마다 로드하지 않도록 **싱글톤(Singleton) 패턴**을 적용하여 서버의 응답성과 메모리 효율성을 극대화했습니다.
3. **고질적인 코덱 및 SSL 버그 해결 (Deep Troubleshooting)**
   - `librosa`가 `.mp3` 압축 포맷을 무음(-35dB)으로 잘못 인식하는 라이브러리 간 호환성 버그를 파악하고, `moviepy`의 추출 로직을 **비압축 무손실 코덱(`pcm_s16le`, `.wav`)**으로 완전히 개편하여 분석 정확도를 100%로 끌어올렸습니다.
   - macOS 환경에서 모델 다운로드 시 발생하는 파이썬의 SSL 인증서 검증 에러(`CERTIFICATE_VERIFY_FAILED`)를 `certifi` 모듈과 Context 오버라이딩을 통해 코드 레벨에서 우아하게 우회했습니다.
4. **Uvicorn 무한 재시작 방어 및 커스텀 런타임(`run_server.py`) 구축**
   - 대용량 ML 라이브러리(`torch` 등) 설치 후 IDE 백그라운드 인덱싱으로 인해 Uvicorn Watchfiles가 무한 재시작되는 현상을 분석했습니다. CLI 옵션(`--reload-exclude`)의 한계를 파악하고, Uvicorn 엔진을 파이썬 코드로 직접 제어하여 감시자를 비활성화하는 **커스텀 서버 실행 스크립트**를 작성, 완벽한 개발 및 분석 안정성을 확보했습니다.
