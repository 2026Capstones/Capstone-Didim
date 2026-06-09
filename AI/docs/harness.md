# AI 면접 분석 서버 (FastAPI) 구현 코드

본 문서는 `python-design-plan.md`에 명시된 요구사항을 바탕으로 작성된 FastAPI 애플리케이션의 전체 소스 코드입니다.

- **Python**: 3.11+
- **Framework**: FastAPI
- **Key Libraries**: Pydantic V2, OpenAI SDK V1+, Uvicorn

## 1. 디렉토리 구조

```
/project
├── main.py           # FastAPI 라우터 및 앱 실행
├── services.py       # 핵심 비즈니스 로직 (오케스트레이션)
├── ai_analyzer.py    # AI 모델 호출 및 분석 (STT, LLM, 더미 분석)
├── models.py         # Pydantic 데이터 모델 (스키마)
├── requirements.txt  # 의존성 패키지 목록
└── temp_media/       # 미디어 파일 임시 저장소
```

---

## 2. `requirements.txt`

프로젝트 실행에 필요한 Python 라이브러리 목록입니다.

```text
fastapi
uvicorn[standard]
python-multipart
openai
pydantic

# 음성/영상 처리를 위한 실제 구현 시 추가
# moviepy
# librosa
# opencv-python
# mediapipe
```

---

## 3. `models.py`

API 요청 및 응답에 사용되는 데이터 구조를 Pydantic V2 모델로 정의합니다.

```python
from pydantic import BaseModel, Field

class InterviewContext(BaseModel):
    """Multipart Form으로 전송된 context_data의 구조"""
    interview_type: str = Field(..., description="면접 유형 (e.g., 'technical', 'personality')")
    current_question: str = Field(..., description="현재 면접 질문")
    student_portfolio: str = Field(..., description="학생 포트폴리오/자기소개서 내용")
    company_info: str = Field(..., description="지원하는 회사 정보")

class BehaviorAnalysis(BaseModel):
    """비언어적 요소 분석 결과"""
    speech_rate_spm: int = Field(..., description="말하기 속도 (syllables per minute)")
    volume_db: float = Field(..., description="음성 평균 데시벨")
    eye_contact_issues: int = Field(..., description="불안정한 시선 처리 횟수")
    posture_issues: int = Field(..., description="불안정한 자세 횟수")

class LLMFeedback(BaseModel):
    """LLM으로부터 생성된 피드백 결과"""
    feedback: str = Field(..., description="답변 내용 및 태도에 대한 종합 피드백")
    score: int = Field(..., ge=0, le=100, description="종합 점수 (0-100)")
    next_question: str = Field(..., description="다음 꼬리 질문")

class AnalysisResult(BaseModel):
    """API 최종 응답 모델"""
    status: str = "SUCCESS"
    behavior_analysis: BehaviorAnalysis
    feedback: str
    score: int
    next_question: str

```

---

## 4. `ai_analyzer.py`

OpenAI API 호출(STT, LLM) 및 비전/오디오 분석(더미)과 같은 AI 관련 로직을 담당합니다.

```python
import os
import json
import asyncio
from pathlib import Path
from typing import Dict, Any

from openai import AsyncOpenAI, OpenAIError
from models import InterviewContext, LLMFeedback, BehaviorAnalysis

# 중요: 실제 프로덕션 환경에서는 환경 변수나 Secret Manager를 통해 API 키를 안전하게 관리해야 합니다.
# 예: client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
client = AsyncOpenAI(api_key="YOUR_OPENAI_API_KEY")

async def transcribe_audio_with_whisper(audio_path: Path) -> str:
    """OpenAI Whisper API를 사용하여 오디오 파일을 텍스트로 변환합니다."""
    print(f"Starting transcription for {audio_path}...")
    try:
        async with client.with_timeout(60.0):
            with open(audio_path, "rb") as audio_file:
                transcript = await client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                )
            print("Transcription successful.")
            return transcript.text
    except OpenAIError as e:
        print(f"Error during transcription: {e}")
        return ""

async def analyze_vision_dummy(video_path: Path) -> Dict[str, int]:
    """[더미] 영상 분석. 시선 처리, 자세 등을 분석한다고 가정합니다."""
    print(f"Analyzing video (dummy) at {video_path}...")
    await asyncio.sleep(0.5) # CPU-bound 작업 시뮬레이션
    return {"eye_contact_issues": 3, "posture_issues": 1}

async def analyze_audio_features_dummy(audio_path: Path) -> Dict[str, Any]:
    """[더미] 음성 특징 분석. 말하기 속도, 음량 등을 분석한다고 가정합니다."""
    print(f"Analyzing audio features (dummy) at {audio_path}...")
    await asyncio.sleep(0.2) # I/O-bound 작업 시뮬레이션
    return {"speech_rate_spm": 280, "volume_db": -15.5}

def _create_llm_prompt(context: InterviewContext, student_answer: str, behavior: BehaviorAnalysis) -> str:
    """LLM에 전달할 프롬프트를 동적으로 생성합니다."""
    persona_map = {
        "technical": "당신은 10년 차 시니어 개발자 기술 면접관입니다. 기술적 깊이를 엄격하게 검증합니다.",
        "personality": "당신은 지원자의 조직 적합성을 파악하는 인사팀장입니다."
    }
    persona = persona_map.get(context.interview_type, "당신은 전문 면접관입니다.")
    behavior_summary = (
        f"시선 처리가 {behavior.eye_contact_issues}회 불안정했으며, "
        f"말하기 속도는 {behavior.speech_rate_spm} SPM으로 다소 빠른 편입니다. "
        f"자세 또한 {behavior.posture_issues}회 불안정한 모습이 보였습니다."
    )
    return f"""
# Role
{persona} `interviewer_persona.md`에 정의된 어투와 역할을 엄격히 준수하십시오.

# Context
- 지원자 정보: {context.student_portfolio}
- 회사 정보: {context.company_info}
- 현재 질문: {context.current_question}

# Applicant's Response & Behavior
- 답변 내용 (STT): "{student_answer}"
- 비언어적 태도: {behavior_summary}

# Instruction
위 모든 정보를 종합하여, 다음 3가지 항목을 JSON 형식으로 생성해주십시오. 반드시 JSON 객체만 반환해야 합니다.
1. `feedback` (string): 답변의 강점과 보완점, 비언어적 태도에 대한 전문가적 조언을 작성하십시오.
2. `score` (integer): 답변의 논리성, 구체성, 직무 연관성, 태도 등을 종합하여 0점에서 100점 사이의 점수를 산출하십시오.
3. `next_question` (string): 위 답변을 바탕으로 역량을 더 깊이 파악할 수 있는 날카로운 꼬리 질문을 하나 생성하십시오.
"""

async def get_feedback_from_llm(context: InterviewContext, student_answer: str, behavior: BehaviorAnalysis) -> LLMFeedback:
    """LLM을 호출하여 피드백, 점수, 다음 질문을 생성하고 Pydantic 모델로 반환합니다."""
    prompt = _create_llm_prompt(context, student_answer, behavior)
    print("Requesting feedback from LLM...")
    try:
        async with client.with_timeout(60.0):
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.5,
            )
        llm_output = response.choices[0].message.content
        print("LLM response received and parsed.")
        return LLMFeedback.model_validate_json(llm_output)
    except (OpenAIError, json.JSONDecodeError) as e:
        print(f"Error during LLM call or parsing: {e}")
        return LLMFeedback(
            feedback="AI 피드백 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
            score=50,
            next_question="다음 질문을 생성하는 데 실패했습니다. 면접을 계속 진행해 주세요."
        )

```

---

## 5. `services.py`

엔드포인트로부터 받은 요청을 받아 전체 분석 프로세스를 오케스트레이션하는 핵심 비즈니스 로직을 포함합니다.

```python
import os
import json
import uuid
import asyncio
from pathlib import Path
from fastapi import UploadFile, HTTPException, status

from models import InterviewContext, AnalysisResult, BehaviorAnalysis
import ai_analyzer

TEMP_DIR = Path("temp_media")
TEMP_DIR.mkdir(exist_ok=True)

async def _save_temp_file(file: UploadFile) -> Path:
    """UploadFile을 임시 디렉토리에 저장하고 경로를 반환합니다."""
    # 파일 확장자를 유지하여 처리 라이브러리가 인식하도록 함
    suffix = Path(file.filename).suffix
    file_path = TEMP_DIR / f"{uuid.uuid4()}{suffix}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    return file_path

def _extract_audio_from_video_dummy(video_path: Path) -> Path:
    """[더미] 비디오 파일에서 오디오를 추출합니다. 실제 구현에서는 moviepy 등을 사용합니다."""
    print(f"Extracting audio from {video_path} (dummy)...")
    audio_path = video_path.with_suffix(".mp3")
    # 실제로는 추출 로직이 필요하지만, 여기서는 STT API가 처리할 수 있도록
    # 더미 오디오 파일이 있다고 가정하거나 빈 파일을 생성합니다.
    if not audio_path.exists():
        audio_path.touch()
    return audio_path

async def process_interview_session(
    context_data_str: str,
    video_file: UploadFile,
    audio_file: UploadFile | None
) -> AnalysisResult:
    """전체 면접 분석 프로세스를 관리합니다."""
    video_path, audio_path_to_process = None, None
    try:
        # Step 1: 요청 수신 및 데이터 전처리
        try:
            context = InterviewContext.model_validate_json(context_data_str)
        except json.JSONDecodeError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "context_data가 유효한 JSON이 아닙니다.")

        video_path = await _save_temp_file(video_file)
        audio_path_to_process = await _save_temp_file(audio_file) if audio_file else _extract_audio_from_video_dummy(video_path)

        # Step 2: 비언어적/언어적 요소 병렬 분석 (I/O 및 네트워크 바운드 작업 동시 실행)
        stt_task = ai_analyzer.transcribe_audio_with_whisper(audio_path_to_process)
        vision_task = ai_analyzer.analyze_vision_dummy(video_path)
        audio_features_task = ai_analyzer.analyze_audio_features_dummy(audio_path_to_process)

        student_answer, vision_result, audio_features = await asyncio.gather(
            stt_task, vision_task, audio_features_task
        )

        behavior_analysis = BehaviorAnalysis(**vision_result, **audio_features)

        # Step 3: LLM 피드백 생성
        llm_feedback = await ai_analyzer.get_feedback_from_llm(
            context=context,
            student_answer=student_answer or "(답변이 인식되지 않았습니다.)",
            behavior_analysis=behavior_analysis
        )

        # Step 4: 최종 응답 구성
        return AnalysisResult(
            behavior_analysis=behavior_analysis,
            **llm_feedback.model_dump()
        )

    finally:
        # Step 5: 임시 파일 정리
        for p in [video_path, audio_path_to_process]:
            if p and p.exists():
                os.remove(p)
        print("Temporary files cleaned up.")

```

---

## 6. `main.py`

FastAPI 애플리케이션의 진입점으로, API 라우터를 정의하고 서버를 실행합니다.

```python
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from models import AnalysisResult
import services

app = FastAPI(
    title="AI Interview Analyzer",
    description="Spring Boot로부터 미디어와 컨텍스트를 받아 AI 분석을 수행하는 FastAPI 서버",
    version="1.0.0"
)

@app.post("/analyze-and-feedback", response_model=AnalysisResult)
async def analyze_and_feedback(
    video_file: UploadFile = File(..., description="사용자의 답변 영상 파일 (.mp4, .mov 등)"),
    context_data: str = Form(..., description="면접 컨텍스트 데이터 (JSON 형식의 문자열)"),
    audio_file: UploadFile | None = File(None, description="사용자의 답변 음성 파일 (선택 사항, .mp3, .wav 등)")
):
    """
    개별 질문에 대한 사용자의 답변(영상/음성)과 면접 컨텍스트를 받아,
    AI 기반 분석을 수행하고 피드백, 점수, 다음 꼬리 질문을 반환합니다.
    """
    try:
        result = await services.process_interview_session(
            context_data_str=context_data,
            video_file=video_file,
            audio_file=audio_file
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        # 예상치 못한 서버 내부 오류 로깅
        print(f"An unexpected server error occurred: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"서버 내부 오류가 발생했습니다. 관리자에게 문의하세요."
        )

@app.get("/", summary="Health Check")
def read_root():
    """서버가 정상적으로 실행 중인지 확인하는 기본 엔드포인트입니다."""
    return {"message": "AI Interview Analyzer is running."}

# 서버 실행 명령어: uvicorn main:app --reload

```