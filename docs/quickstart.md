# 🚀 Didim 프로젝트 Quick Start 가이드

**Didim** 플랫폼을 성공적으로 클론하신 것을 환영합니다! 이 가이드는 로컬 환경에서 백엔드(Spring Boot), AI 서버(FastAPI), 그리고 프론트엔드(React)를 설치하고 실행하는 방법을 단계별로 안내합니다.

---

## 📋 사전 준비 사항 (Prerequisites)

시작하기 전에 다음 도구들이 설치되어 있는지 확인하세요:
- **Java:** JDK 17 이상
- **Node.js:** v18.x 이상 (npm 포함)
- **Python:** v3.9 이상
- **IDE:** IntelliJ IDEA, VS Code, 또는 PyCharm 추천

---

## 🛠️ 1단계: 백엔드 서버 설정 및 실행 (Spring Boot)

백엔드 서버는 `8080` 포트에서 실행되며 데이터베이스 관리 및 핵심 비즈니스 로직을 담당합니다.

1.  `Back` 디렉토리로 이동합니다:
    ```bash
    cd Back
    ```
2.  의존성을 설치하고 서버를 실행합니다:
    ```bash
    ./gradlew bootRun
    ```
    *(Windows 사용자는 `gradlew.bat bootRun`을 사용하세요)*

- **API 주소:** `http://localhost:8080`
- **H2 콘솔:** `http://localhost:8080/h2-console` (ID: `sa`, PW: 없음)
- **Swagger 문서:** `http://localhost:8080/swagger-ui.html`

---

## 🤖 2단계: AI 서버 설정 및 실행 (FastAPI)

AI 서버는 `8000` 포트에서 실행되며 영상/음성 분석 및 꼬리 질문 생성을 담당합니다.

1.  `AI` 디렉토리로 이동합니다:
    ```bash
    cd AI
    ```
2.  가상 환경을 생성하고 활성화합니다 (선택 사항이나 권장):
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # MacOS/Linux
    # .venv\Scripts\activate  # Windows
    ```
3.  필요한 패키지를 설치합니다:
    ```bash
    pip install -r requirements.txt
    ```
4.  서버를 실행합니다:
    ```bash
    python run_server.py
    ```

- **API 주소:** `http://127.0.0.1:8000`

---

## 💻 3단계: 프론트엔드 설정 및 실행 (React)

프론트엔드는 사용자가 인터랙션하는 웹 인터페이스입니다.

1.  `Front` 디렉토리로 이동합니다:
    ```bash
    cd Front
    ```
2.  패키지를 설치합니다:
    ```bash
    npm install
    ```
3.  개발 서버를 실행합니다:
    ```bash
    npm run dev
    ```

- **웹 주소:** 브라우저에서 `http://localhost:5173` 접속 (Vite 기본 포트)

---

## 🔐 4단계: 테스트 및 로그인

통합 테스트를 위해 미리 등록된 더미 계정을 사용하세요.

- **학생 계정 (Student):**
    - ID: `student@didim.com`
    - PW: `password`
- **관리자 계정 (Admin):**
    - ID: `admin@didim.com`
    - PW: `password`

---

## 💡 실행 팁 및 주의 사항

1.  **실행 순서:** 백엔드(`8080`) -> AI 서버(`8000`) -> 프론트엔드(`5173`) 순서로 실행하는 것을 권장합니다.
2.  **포트 확인:** 각 서버가 지정된 포트를 정상적으로 점유하고 있는지 확인하세요.
3.  **미디어 권한:** AI 면접 테스트 시 브라우저에서 **카메라 및 마이크 권한**을 허용해야 합니다.
4.  **파일 업로드:** 현재 설정상 파일 업로드 제한은 **10MB**입니다. 너무 큰 영상 파일은 업로드가 실패할 수 있습니다.

---

**즐거운 개발 되시길 바랍니다! 문의 사항은 이슈 트래커를 이용해 주세요.**
