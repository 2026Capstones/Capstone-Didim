# 🎓 AI 기반 대학생 취업 지원 통합 플랫폼 (DidimCapstone) - Backend

이 프로젝트는 대학 LMS 데이터와 AI 기술을 결합하여 학생들의 포트폴리오 자동 완성, 맞춤형 자소서 생성, 그리고 실감 나는 AI 면접 시뮬레이션을 제공하는 백엔드 시스템입니다.

---

## 🚀 프로젝트 개요 (Overview)
취업 준비 과정의 고질적인 비효율을 해결하기 위해 학교 H100 GPU 서버와 OpenAI API를 활용한 원스톱 취업 솔루션입니다.

### 🌟 핵심 차별화 기능
1.  **LMS 연동 포트폴리오 자동화**: 별도의 입력 없이 학교 성적, 수상 경력, 활동 이력을 자동으로 수집하여 포트폴리오를 생성합니다.
2.  **PDF 기반 경험 확장**: 사용자가 본인의 프로젝트 증빙 PDF를 올리면 AI가 내부 텍스트를 추출하여 데이터베이스에 구조화된 형태로 저장합니다.
3.  **AI 맞춤형 자소서 생성**: 공고의 직무 역량과 학생의 풍부한 경험(LMS + PDF 추출 데이터)을 결합하여 기업 맞춤형 자기소개서를 30초 이내에 자동 생성합니다.
4.  **AI 면접 시뮬레이터 (STT/TTS)**: 
    *   **실시간 음성 상호작용**: AI 면접관이 직접 질문을 읽어주고(TTS), 사용자의 음성 답변을 인식(STT)합니다.
    *   **심층 꼬리 질문**: 지원자의 답변을 실시간으로 분석하여 역량을 파고드는 날카로운 꼬리 질문과 평가를 제공합니다.
5.  **정밀 취업 매칭**: AI가 공고와 포트폴리오를 대조하여 매칭 점수(%)와 구체적인 합격 가능 사유를 분석해 줍니다.

---

## 🛠 시작하기 (Getting Started)

백엔드 서버를 로컬 환경에서 구동하기 위한 단계별 가이드입니다.

### 1. 사전 준비 (Prerequisites)
*   **Java 17** (또는 그 이상)
*   **Gradle 9.3.0**
*   **OpenAI API Key** (STT/TTS용)
*   **학교 AI 서버 접근 권한** (Chat/분석용)

### 2. 환경 설정 (Configuration)
`src/main/resources` 폴더에 `application-API-KEY.properties` 파일을 생성하고 아래의 키 정보를 입력합니다. (이 파일은 보안상 Git에 커밋되지 않도록 주의하세요.)

```properties
# 학교 AI 서버 키 (Chat용)
AI-KEY=your_school_ai_key_here

# OpenAI 공식 키 (Audio - STT/TTS용)
OPENAI-KEY=your_openai_official_key_here
```

### 3. 프로젝트 빌드 및 실행
터미널에서 프로젝트 루트 디렉토리로 이동한 후 다음 명령어를 실행합니다.

```bash
# Gradle 빌드
./gradlew clean build

# 서버 실행
java -jar build/libs/back-0.0.1-SNAPSHOT.jar
```

### 4. API 테스트 및 문서 확인
서버가 정상적으로 구동되면 브라우저에서 **Swagger UI**를 통해 모든 API를 직접 테스트해 볼 수 있습니다.
*   **URL**: `http://localhost:8080/swagger-ui/index.html`

---

## 📁 프로젝트 구조 (Architecture)
*   **Controller**: API 엔드포인트 정의 및 요청/응답 처리
*   **Service**: 비즈니스 로직 처리 및 AI 연동 (Match, Resume, Interview, STT/TTS 등)
*   **Domain (Entity)**: JPA 기반 데이터베이스 매핑
*   **Repository**: 데이터 영속성 관리
*   **DTO**: 계층 간 데이터 전송 및 API 응답 규격화

---

## ⚠️ 주의사항
*   모든 API는 JWT 기반 인증이 필요합니다. 테스트 전 `/api/auth/login`을 통해 토큰을 발급받아 Swagger 상단의 **Authorize**에 등록하세요.
*   H2 인메모리 데이터베이스를 사용하므로 서버 재시작 시 데이터가 초기화됩니다. (실제 운영 시 MySQL/Oracle 전환 가능)

---

## 📝 수정 및 변경 내역
자세한 변경 사항은 `docs/fixs.md` 파일을 참조하시기 바랍니다.
