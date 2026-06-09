# AI 면접/발표 분석 서비스 아키텍처 (지연 피드백 구조)

본 문서는 Spring Boot(메인 서버)와 Python FastAPI(AI 분석 서버) 간의 효율적인 통신 로직을 정의합니다. 무거운 서버 부하를 방지하기 위해 전체 영상을 한 번에 처리하지 않고, 문항별 분할 처리(Chunking) 및 지연 피드백(Delayed Feedback) 방식을 채택했습니다.

## 1. 아키텍처 핵심 흐름 (지연 피드백 + FastAPI 전담)

프론트엔드(20초 내외) : 사용자가 1개 질문에 대답하는 짧은 시간(약 20초) 동안만 캠과 마이크를 녹화/녹음하여 백엔드(Spring Boot)로 전송합니다.

Spring Boot (단순 전달자 & 저장소): 프론트에서 받은 이 20초짜리 미디어 데이터를 묻지도 따지지도 않고 FastAPI로 바로 토스(Pass)합니다.

FastAPI (열일하는 분석가): 미디어를 받자마자 STT 변환(텍스트화) + 비전 분석(자세, 시선) + 오디오 분석(빠르기, 데시벨)을 수행합니다. 분석이 끝나면 결과를 바탕으로 LLM에게 "평가 피드백, 점수, 다음 꼬리 질문"을 생성하도록 요청하여 Spring Boot로 돌려줍니다.

Spring Boot (비밀의 방): FastAPI가 전달한 피드백과 점수를 DB(InterviewQa 테이블 등)에 조용히 은닉하여 저장합니다. 프론트엔드 사용자에게는 피드백은 숨기고 오직 "다음 질문"만 던져줍니다.

마지막 N번째 질문 종료 시 (피날레): 마지막 질문의 분석까지 끝나면, Spring Boot는 그동안 DB에 숨겨두었던 1~N번까지의 모든 피드백과 점수(그리고 평균 총점)를 리스트로 묶어서 프론트엔드에 일괄적으로 뿌려줍니다.

## 2. 전체 통신 흐름도 (Sequence)

sequenceDiagram
    participant Client as Frontend (User)
    participant Spring as Spring Boot (DB & Router)
    participant FastAPI as Python AI (Analyzer & LLM)
    
    Note over Client, FastAPI: [Phase 1] 면접 진행 중 (매 질문 반복)
    Client->>Spring: 짧은 미디어 제출 (약 20초 영상/음성)
    
    Spring->>FastAPI: 미디어 데이터 토스 (POST /analyze-and-feedback)
    
    Note over FastAPI: 1. 미디어 병렬 분석 (STT, 시선/자세, 음성 특징)<br/>2. 분석 결과 종합<br/>3. LLM 기반 피드백, 점수, 꼬리 질문 생성
    
    FastAPI-->>Spring: 단일 문항 분석 결과 반환<br/>(피드백, 점수, 다음 꼬리 질문)
    
    Spring->>Spring: DB에 피드백 및 점수 임시 저장 (은닉)
    Spring-->>Client: 다음 꼬리 질문만 전달 (피드백 숨김)

    Note over Client, FastAPI: [Phase 2] 면접 종료 (마지막 질문)
    Client->>Spring: 마지막 미디어 제출
    Spring->>FastAPI: 마지막 분석 요청
    FastAPI-->>Spring: 마지막 피드백 반환
    
    Spring->>Spring: DB에 마지막 정보 저장 및 전체 총평/총점 계산
    
    Note over Client, Spring: ★ 비밀의 방 개방 ★
    Spring-->>Client: 면접 종료 및 그동안 숨겨둔 전체 피드백 리포트 일괄 반환


## 3. 핵심 통신 API 명세서 (수정본)

### 3.1. [Spring Boot ➡️ FastAPI] 단일 문항 분석 및 피드백 요청

Endpoint: POST http://localhost:8000/analyze-and-feedback

Content-Type: multipart/form-data

역할: 분할된 미디어 데이터와 면접 맥락 데이터를 FastAPI에 전달하여 다각도 분석 및 LLM 피드백/꼬리 질문 생성을 요청합니다.

Request (Multipart Form):

video_file: (File) 프론트엔드에서 녹화된 20초 내외의 비디오 파일 원본

audio_file: (File) 녹음된 오디오 파일 원본 (비디오에 포함되어 있다면 생략 가능)

context_data: (String/JSON) 면접 컨텍스트 데이터

{
  "interview_type": "technical",
  "current_question": "Spring Boot의 동작 원리에 대해 설명해 보세요.",
  "student_portfolio": "GPA 4.0, 자바 프로젝트 3회...",
  "company_info": "인재상: 도전적인 사람..."
}


Response Body (JSON):

{
  "status": "SUCCESS",
  "behavior_analysis": {
    "speech_rate_spm": 280,
    "volume_db": -15.5,
    "eye_contact_issues": 3,
    "posture_issues": 1
  },
  "feedback": "동작 원리를 잘 설명했으나, 시선 처리가 다소 불안정합니다.",
  "score": 85,
  "next_question": "그렇다면 Spring Boot의 내장 톰캣은 어떻게 동작하나요?"
}


### 3.2. [Spring Boot ➡️ Frontend] 다음 질문 응답 (피드백 은닉)

Endpoint: POST http://localhost:8080/api/interview/answer/{interviewId}

역할: FastAPI로부터 받은 데이터 중 피드백과 점수는 Spring Boot DB(InterviewQa)에 은닉하여 저장하고, 사용자가 면접에 집중할 수 있도록 오직 새로운 질문만 화면에 렌더링하도록 반환합니다.

Response Body (JSON): 우리가 만들어둔 InterviewResponse DTO를 활용합니다.

{
  "success": true,
  "message": "답변 처리 및 다음 질문 생성 완료",
  "data": {
    "interviewId": "1234-abcd-...",
    "status": "IN_PROGRESS",
    "current_question_no": 2,
    "next_question": "그렇다면 Spring Boot의 내장 톰캣은 어떻게 동작하나요?"
    // (주의) 프론트엔드는 이 응답에서 'next_question'만 화면에 표시하고 TTS로 읽어줍니다.
    // 피드백과 점수 데이터는 이 시점에서 프론트로 내려가지 않습니다.
  }
}


### 3.3. [Spring Boot ➡️ Frontend] 면접 종료 및 최종 종합 리포트 반환

Endpoint: GET http://localhost:8080/api/interview/result/{interviewId}

역할: 마지막 질문이 종료된 후, Spring Boot DB에 숨겨두었던 1번부터 N번까지의 모든 피드백, 점수, 비언어적 분석 결과와 종합 총평을 한 번에 프론트엔드에 제공합니다.

Response Body (JSON):

{
  "success": true,
  "message": "면접 종료. 종합 리포트 반환",
  "data": {
    "interviewId": "1234-abcd-...",
    "status": "COMPLETED",
    "totalScore": 82,
    "overallFeedback": "기술적 이해도는 훌륭하나 면접 태도에서 시선 불안정이 관찰됩니다.",
    "qaList": [
      {
        "question": "Spring Boot 동작 원리는?",
        "answer": "어.. 그게...",
        "feedback": "내용은 좋으나 시선 처리가 불안정합니다.",
        "score": 85
      }
      // ... 2번, 3번 내역들 ...
    ]
  }
}


## 4. 아키텍처 기대 효과

서버 부하 분산 (1/N): 한 번에 무거운 영상을 처리하지 않으므로 Timeout 발생 확률이 극도로 낮아지며, 무거운 메시지 큐(Celery 등) 없이도 안정적인 처리가 가능합니다.

자연스러운 사용자 경험(UX): 꼬리 질문이 즉각적으로 이어지므로 실제 면접관과 대화하는 듯한 긴장감과 몰입감을 제공합니다.

명확한 역할 분담: AI의 무거운 연산(비전, 오디오, LLM)은 Python 생태계인 FastAPI가 전담하고, 비즈니스 로직과 데이터 은닉/저장은 Spring Boot가 전담하여 유지보수가 용이해집니다.

## 5. 추후 개선점 및 확장 전략 (Future Works)

### 5.1. 포트폴리오 데이터 처리 최적화
실제 상용 서비스 시행 시, 방대한 학생 포트폴리오 데이터를 매 질문마다 LLM에 전송하는 것은 과도한 토큰 소모와 응답 지연을 초래할 수 있습니다. 이를 해결하기 위해 다음과 같은 전략을 채택할 예정입니다.
- **맞춤형 요약 분석:** 교내 로컬 LLM(H100 등)을 사용하지 않는 환경(External API 기반 서비스)의 경우, 학생의 LMS 이력과 프로젝트 경험 중 **지원 회사의 직무와 연관성이 높은 핵심 항목들을 AI가 미리 10줄 이내로 요약**하여 분석에 활용합니다.
- **비용 효율성 제고:** 불필요한 컨텍스트 전달을 최소화하여 토큰 비용을 80% 이상 절감하고, AI 분석의 집중도와 응답 속도를 향상시킵니다.

### 5.2. 분석 엔진 고도화
- 현재 MediaPipe 기반의 비언어적 분석 로직을 딥러닝 모델로 고도화하여 더 정교한 시선 처리 및 태도 분석 결과를 도출할 예정입니다.
- 음성 분석 결과(dB, SPM)와 STT 결과(텍스트)를 결합하여 답변의 논리성뿐만 아니라 전달력에 대한 다각도 피드백을 제공합니다.