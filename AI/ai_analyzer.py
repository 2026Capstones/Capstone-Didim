import os
import json
import logging
import asyncio
import ssl
import certifi
from pathlib import Path
from typing import Dict, Any, Optional

from openai import AsyncOpenAI, OpenAIError
from dotenv import load_dotenv
from pydantic import ValidationError
from models import InterviewContext, LLMFeedback, BehaviorAnalysis

# macOS 등 일부 환경에서 Whisper 모델 다운로드 시 발생하는 SSL 에러 해결
os.environ['SSL_CERT_FILE'] = certifi.where()
ssl._create_default_https_context = ssl._create_unverified_context

# 로컬 Whisper 관련 임포트
import whisper
import torch

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- 로컬 Whisper 모델 관리 (Singleton) ---
_whisper_model = None

def get_whisper_model():
    """로컬 Whisper 모델을 싱글톤으로 관리하며 필요한 시점에 로드합니다."""
    global _whisper_model
    if _whisper_model is None:
        logging.info("Loading local Whisper model ('base')...")
        # M4 가속(MPS) 사용 가능 여부 확인
        device = "mps" if torch.backends.mps.is_available() else "cpu"
        logging.info(f"Using device: {device}")
        # 모델 사이즈 선정: 'base'는 속도와 정확도의 좋은 균형점입니다.
        _whisper_model = whisper.load_model("base", device=device)
        logging.info("Whisper model loaded successfully.")
    return _whisper_model

# 1. STT(음성 인식) 전용 클라이언트
# 로컬 Whisper를 사용하므로 API 키가 필수는 아니지만, 하위 호환성을 위해 유지합니다.
stt_api_key = os.getenv("OPENAI_API_KEY")
stt_client = AsyncOpenAI(api_key=stt_api_key, timeout=60.0) if stt_api_key else None

# 2. 면접 피드백(LLM) 전용 클라이언트 (학과 H100 서버 - Qwen2.5 사용)
# ※ 자소서 생성은 Spring Boot가 알아서 처리하여 context_data로 넘겨주므로,
# FastAPI는 넘겨받은 자소서를 참조해 H100에 '면접 피드백'만 요청합니다.
llm_base_url = os.getenv("LLM_BASE_URL")  # H100 서버 주소
llm_api_key = os.getenv("LLM_API_KEY", "dummy-key")
llm_model = os.getenv("LLM_MODEL", "qwen2.5-32b-instruct")

# LLM_BASE_URL이 존재하면 H100으로 붙고, 없으면 예비용으로 OpenAI 서버로 붙도록 분기 처리
llm_client = AsyncOpenAI(api_key=llm_api_key, base_url=llm_base_url, timeout=60.0) if llm_base_url else stt_client

async def transcribe_audio_with_whisper(audio_path: Path) -> str:
    """로컬 Whisper 모델을 사용하여 오디오 파일을 텍스트로 변환합니다."""
    logging.info(f"Starting local transcription for {audio_path}...")
    try:
        # 모델 로드 (싱글톤)
        model = await asyncio.to_thread(get_whisper_model)
        
        # 음성 인식 수행 (CPU/GPU 바운드 작업이므로 별도 스레드에서 실행)
        # language="ko"를 지정하여 한국어 인식률을 최적화합니다.
        result = await asyncio.to_thread(
            model.transcribe, 
            str(audio_path), 
            language="ko"
        )
        
        # 타입 체커(Pylance) 에러 방지를 위한 명시적 타입 확인
        if isinstance(result, dict):
            # 뽑아낸 값을 명시적으로 문자열로 캐스팅하여 .strip() 에러 방지
            transcript_text = str(result.get("text", "")).strip()
        else:
            transcript_text = str(result).strip()
            
        logging.info(f"Transcription successful. Result: {transcript_text[:50]}...")
        return transcript_text
        
    except Exception as e:
        logging.error(f"Error during local transcription: {e}")
        return ""

def analyze_vision_real(video_path: Path) -> Dict[str, int]:
    """MediaPipe Tasks API를 사용하여 영상에서 시선 처리 및 자세를 분석합니다 (동기 함수)."""
    import cv2
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    import numpy as np

    logging.info(f"Analyzing video with MediaPipe Tasks API at {video_path}...")
    
    # 모델 파일 경로 설정
    face_model_path = 'models/face_landmarker.task'
    pose_model_path = 'models/pose_landmarker.task'
    
    if not os.path.exists(face_model_path) or not os.path.exists(pose_model_path):
        logging.error("MediaPipe model files are missing. Please ensure models/*.task files exist.")
        return {"eye_contact_issues": 0, "posture_issues": 0}

    eye_contact_issues = 0
    posture_issues = 0
    total_frames = 0
    
    # 1. Face Landmarker 설정
    base_options_face = python.BaseOptions(model_asset_path=face_model_path)
    options_face = vision.FaceLandmarkerOptions(
        base_options=base_options_face,
        output_face_blendshapes=True,
        output_facial_transformation_matrixes=True,
        num_faces=1
    )
    
    # 2. Pose Landmarker 설정
    base_options_pose = python.BaseOptions(model_asset_path=pose_model_path)
    options_pose = vision.PoseLandmarkerOptions(
        base_options=base_options_pose,
        running_mode=vision.RunningMode.IMAGE
    )

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        logging.error(f"Could not open video: {video_path}")
        return {"eye_contact_issues": 0, "posture_issues": 0}

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0: fps = 30
    frame_interval = max(1, int(fps / 5))

    with vision.FaceLandmarker.create_from_options(options_face) as face_landmarker, \
         vision.PoseLandmarker.create_from_options(options_pose) as pose_landmarker:
        
        while cap.isOpened():
            success, image_bgr = cap.read()
            if not success:
                break
            
            if total_frames % frame_interval == 0:
                image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
                
                # 1. 시선 처리 분석
                face_result = face_landmarker.detect(mp_image)
                if face_result.face_landmarks:
                    landmarks = face_result.face_landmarks[0]
                    # 코 끝(index 1)과 얼굴 양 끝(index 234, 454) 좌표
                    nose_tip = landmarks[1]
                    left_edge = landmarks[234]
                    right_edge = landmarks[454]
                    
                    face_width = right_edge.x - left_edge.x
                    if face_width > 0:
                        relative_nose_x = (nose_tip.x - left_edge.x) / face_width
                        if not (0.35 < relative_nose_x < 0.65):
                            eye_contact_issues += 1
                else:
                    eye_contact_issues += 1

                # 2. 자세 분석
                pose_result = pose_landmarker.detect(mp_image)
                if pose_result.pose_landmarks:
                    p_landmarks = pose_result.pose_landmarks[0]
                    left_shoulder = p_landmarks[11]
                    right_shoulder = p_landmarks[12]
                    
                    shoulder_tilt = abs(left_shoulder.y - right_shoulder.y)
                    if shoulder_tilt > 0.05:
                        posture_issues += 1
                
            total_frames += 1
            
    cap.release()
    logging.info(f"Video analysis complete. Total frames: {total_frames}")
    return {
        "eye_contact_issues": eye_contact_issues,
        "posture_issues": posture_issues
    }

async def analyze_vision_dummy(video_path: Path) -> Dict[str, int]:
    """[DEPRECATED] 실제 분석을 위해 analyze_vision_real을 스레드 풀에서 실행합니다."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, analyze_vision_real, video_path)

def analyze_audio_features_real(audio_path: Path) -> Dict[str, Any]:
    """librosa를 사용하여 오디오의 특징(음량, 말하기 속도 추정)을 분석합니다."""
    import librosa
    import numpy as np

    logging.info(f"Analyzing audio features with librosa at {audio_path}...")
    try:
        y, sr = librosa.load(str(audio_path))
        if len(y) == 0:
            return {"speech_rate_spm": 0, "volume_db": -60.0}

        # 1. 평균 음량 (dB) 계산
        rms = librosa.feature.rms(y=y)
        avg_rms = np.mean(rms)
        # RMS를 dB로 변환 (기본적인 레퍼런스 값 사용)
        volume_db = 20 * np.log10(avg_rms + 1e-9)

        # 2. 말하기 속도(SPM) 추정
        duration_sec = librosa.get_duration(y=y, sr=sr)
        duration_min = duration_sec / 60.0
        
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
        syllable_count = len(onset_frames)
        
        speech_rate_spm = int(syllable_count / duration_min) if duration_min > 0 else 0

        logging.info(f"Audio analysis complete. Volume: {volume_db:.2f}dB, Estimated SPM: {speech_rate_spm}")
        return {
            "speech_rate_spm": speech_rate_spm,
            "volume_db": float(volume_db)
        }
    except Exception as e:
        logging.error(f"Failed to analyze audio features: {e}")
        return {"speech_rate_spm": 0, "volume_db": -60.0}

async def analyze_audio_features_dummy(audio_path: Path) -> Dict[str, Any]:
    """[DEPRECATED] 실제 분석을 위해 analyze_audio_features_real을 스레드 풀에서 실행합니다."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, analyze_audio_features_real, audio_path)

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
    logging.info("Requesting feedback from LLM...")
    
    # 타입 체커 에러 방지 (llm_client가 None일 가능성 배제)
    if not llm_client:
        logging.error("LLM Client is not initialized. Check your environment variables.")
        return LLMFeedback(
            feedback="서버에 AI 피드백을 생성하기 위한 설정이 부족합니다. (API 키 미설정)",
            score=0,
            next_question="다음 질문을 생성할 수 없습니다."
        )

    try:
        response = await llm_client.chat.completions.create(
            model=llm_model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.5,
        )
        # 타입 체커 에러 방지: content는 None이 될 수 있으므로 기본값("{}") 처리
        llm_output = response.choices[0].message.content or "{}"
        logging.info("LLM response received.")
        
        # Pydantic 버전에 따른 안전한 파싱
        if hasattr(LLMFeedback, "model_validate_json"):
            return LLMFeedback.model_validate_json(llm_output)
        return LLMFeedback.parse_raw(llm_output)
    except (OpenAIError, ValidationError) as e:
        logging.error(f"Error during LLM call or parsing: {e}")
        return LLMFeedback(
            feedback="AI 피드백 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
            score=50,
            next_question="다음 질문을 생성하는 데 실패했습니다. 면접을 계속 진행해 주세요."
        )
