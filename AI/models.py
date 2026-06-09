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
    student_answer: str = Field(..., description="AI가 인식한 지원자의 답변 텍스트 (STT 결과)")
    behavior_analysis: BehaviorAnalysis = Field(..., description="비언어적 요소 분석 결과")
    llm_feedback: LLMFeedback = Field(..., description="LLM 피드백 결과")