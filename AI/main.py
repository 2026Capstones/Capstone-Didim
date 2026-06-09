import logging
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
        logging.exception("An unexpected server error occurred")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"서버 내부 오류가 발생했습니다. 관리자에게 문의하세요."
        )

@app.get("/", summary="Health Check")
def read_root():
    """서버가 정상적으로 실행 중인지 확인하는 기본 엔드포인트입니다."""
    return {"message": "AI Interview Analyzer is running."}

