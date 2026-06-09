# 🚀 디딤(Didim) 프로젝트 퀵스타트 가이드

반갑습니다! **디딤(Didim)** 프로젝트에 오신 것을 환영합니다. 이 가이드는 GitHub에서 프로젝트를 클론한 후, 로컬 환경에서 전체 시스템을 빠르고 쉽게 실행할 수 있도록 도와드립니다.

본 프로젝트는 **프론트엔드(React)**, **백엔드(Spring Boot)**, **AI 서버(FastAPI)** 세 개의 주요 파트로 구성되어 있습니다.

---

## 📋 사전 준비 사항

시작하기 전에 다음 도구들이 설치되어 있는지 확인해 주세요:

*   **Java 17** 이상 (백엔드 실행용)
*   **Node.js 18** 이상 (프론트엔드 실행용)
*   **Python 3.9** 이상 (AI 서버 실행용)
*   **MySQL 8.0** (선택 사항: 기본은 H2 인메모리 DB를 사용합니다)

---

## 🛠️ 단계별 실행 방법

가장 권장하는 실행 순서는 **AI 서버 -> 백엔드 -> 프론트엔드** 순입니다.

### 1. AI 분석 서버 설정 (Python FastAPI)

AI 서버는 면접 영상 분석 및 질문 생성을 담당합니다.

```bash
# AI 디렉토리로 이동
cd AI

# 가상환경 생성 (권장)
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 필요한 패키지 설치
pip install -r requirements.txt

# 서버 실행
uvicorn main:app --reload --reload-dir . --reload-exclude ".venv" --reload-exclude "temp_media"
```
*   **기본 주소:** `http://127.0.0.1:8000`
*   **참고:** `openai` 기능과 `교내 LLM`을 사용하려면 `.env` 파일에 `OPENAI_API_KEY` 설정이 필요할 수 있습니다.

### 2. 백엔드 서버 설정 (Spring Boot)

백엔드는 비즈니스 로직과 데이터 관리를 담당합니다.

```bash
# Back 디렉토리로 이동
cd Back

# Gradle 빌드 및 실행 (Windows는 gradlew.bat 사용)
./gradlew bootRun
```
*   **기본 주소:** `http://127.0.0.1:8080`
*   **API 문서(Swagger):** `http://127.0.0.1:8080/swagger-ui/index.html`
*   **DB 콘솔:** `http://127.0.0.1:8080/h2-console` (JDBC URL: `jdbc:h2:mem:didimdb`)

### 3. 프론트엔드 설정 (React + Vite)

사용자 화면을 담당하는 프론트엔드입니다.

```bash
# Front 디렉토리로 이동
cd Front

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```
*   **접속 주소:** 화면에 표시되는 주소(보통 `http://localhost:5173`)로 접속하세요.

---

## 🔐 테스트 계정 정보

시스템 테스트를 위해 미리 등록된 계정입니다.

*   **학생 계정 (Student):**
    *   ID: `student@didim.com`
    *   PW: `password`
*   **관리자 계정 (Admin):**
    *   ID: `admin@didim.com`
    *   PW: `password`

---

## 💡 주요 참고 사항

*   **데이터베이스:** 현재 `application.properties` 설정에 따라 H2 인메모리 데이터베이스가 기본으로 작동합니다. 서버 재시작 시 데이터가 초기화됩니다. 실제 MySQL을 연결하려면 `application-prod.yml`이나 `application.properties`의 DB 연결 정보를 수정하세요.
*   **API 연동:** 프론트엔드에서 백엔드로의 요청은 기본적으로 `localhost:8080`을 바라보도록 설정되어 있습니다.
*   **포트 충돌:** 만약 포트가 이미 사용 중이라면 각 서버의 설정 파일(`application.properties`, `main.py`, `vite.config.ts`)에서 포트 번호를 변경할 수 있습니다.

---

## ❓ 도움이 필요하신가요?

실행 중 문제가 발생하면 `docs/` 디렉토리의 상세 문서를 확인하거나 이슈를 남겨주세요.

**즐거운 코딩 되세요! 💻**
