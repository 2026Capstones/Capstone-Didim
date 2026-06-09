import os
import json
import uuid
import logging
import asyncio
from typing import Optional
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from pydantic import ValidationError

from models import InterviewContext, AnalysisResult, BehaviorAnalysis
import ai_analyzer

# moviepy v2.0+ 최신 표준 임포트
from moviepy import VideoFileClip

TEMP_DIR = Path("temp_media")

async def _save_temp_file(file: UploadFile) -> Path:
    """UploadFile을 임시 디렉토리에 저장하고 경로를 반환합니다."""

    # 서버가 켜질 때가 아니라, 실제 파일이 업로드될 때만 폴더 확인/생성 (무한 재시작 방지)
    TEMP_DIR.mkdir(exist_ok=True)
    
    # 파일 확장자를 유지하여 처리 라이브러리가 인식하도록 함
    # 파일명이 None일 경우를 대비한 방어 코드 (타입 체커 에러 방지)
    filename = file.filename if file.filename else "temp_media.mp4"
    suffix = Path(filename).suffix
    file_path = TEMP_DIR / f"{uuid.uuid4()}{suffix}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    return file_path

def _extract_audio_from_video(video_path: Path) -> Path:
    """비디오 파일에서 오디오를 추출하여 wav 파일로 저장합니다."""
    if not VideoFileClip:
        raise ImportError("moviepy가 설치되지 않았습니다. 'pip install moviepy'로 설치해주세요.")

    logging.info(f"Extracting audio from {video_path}...")
    audio_path = video_path.with_suffix(".wav")
    try:
        video_clip = VideoFileClip(str(video_path))
        if video_clip.audio is None:
            video_clip.close()
            raise ValueError("비디오 파일에 오디오 트랙이 존재하지 않습니다.")
            
        # 멀티스레드 환경에서 로거로 인한 멈춤(Freezing) 방지 및 무손실 wav 코덱 사용
        video_clip.audio.write_audiofile(str(audio_path), codec='pcm_s16le', logger=None)
        video_clip.close()
        logging.info(f"Audio extracted successfully to {audio_path}")
        return audio_path
    except Exception as e:
        logging.error(f"Failed to extract audio from {video_path}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="비디오에서 오디오를 추출하는 데 실패했습니다.")

async def process_interview_session(
    context_data_str: str,
    video_file: UploadFile,
    audio_file: Optional[UploadFile]
) -> AnalysisResult:
    """전체 면접 분석 프로세스를 관리합니다."""
    # 엄격한 타입 체킹 환경(Pylance 등)에서 타입 추론 오류가 나지 않도록 명시적 선언
    video_path: Optional[Path] = None
    audio_path_to_process: Optional[Path] = None
    try:
        # Step 1: 요청 수신 및 데이터 전처리
        try:
            if hasattr(InterviewContext, "model_validate_json"):
                context = InterviewContext.model_validate_json(context_data_str)
            else:
                context = InterviewContext.parse_raw(context_data_str)
        except (ValidationError, ValueError):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="context_data가 유효한 JSON이 아닙니다.")

        video_path = await _save_temp_file(video_file)
        if audio_file:
            audio_path_to_process = await _save_temp_file(audio_file)
        else:
            loop = asyncio.get_running_loop()
            audio_path_to_process = await loop.run_in_executor(None, _extract_audio_from_video, video_path)

        # 에디터의 타입 체커(Pylance 등)가 발생시키는 Type Error 빨간줄 방지
        if not video_path or not audio_path_to_process:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="미디어 파일 처리에 실패했습니다.")

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
            behavior=behavior_analysis
        )

        # Step 4: 최종 응답 구성
        return AnalysisResult(
            student_answer=student_answer or "(답변이 인식되지 않았습니다.)",
            behavior_analysis=behavior_analysis,
            llm_feedback=llm_feedback
        )

    finally:
        # Step 5: 임시 파일 정리
        for p in [video_path, audio_path_to_process]:
            if p:
                p.unlink(missing_ok=True)
        logging.info("Temporary files cleaned up.")