# Front Quickstart 가이드

디딤(Didim) 프로젝트의 프론트엔드 실행 방법과 주요 워크플로우를 안내합니다.

## 🚀 실행 방법

프로젝트를 로컬 환경에서 실행하려면 다음 명령어를 순서대로 입력하세요.

```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev
```

- **로컬 주소:** [http://localhost:5173](http://localhost:5173) (기본값)
- **빌드:** `npm run build`

## 🛠 기술 스택

- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Routing:** React Router Dom v7
- **Styling:** Vanilla CSS (Global & Component-scoped)

## 🔄 실행 플로우 (User Workflow)

사용자가 앱을 사용하는 주요 흐름은 다음과 같습니다.

1. **로그인 (`/login`)**
   - 사용자가 처음 접속하면 로그인 페이지로 이동합니다.
2. **홈 대시보드 (`/home`)**
   - 로그인 후 지수님의 커리어 대시보드에 진입합니다.
   - 현재 취업 준비 현황(학점, 자격증 등)과 '지금 먼저 할 일'을 확인합니다.
3. **포트폴리오 동기화 및 관리 (`/portfolio`)**
   - '학교 포트폴리오 동기화' 버튼을 통해 LMS 데이터를 가져옵니다.
   - 학점, 수상 내역, 자격증, 프로젝트 등을 카테고리별로 관리합니다.
4. **AI 자소서 첨삭 (`/cover-letters`)**
   - 작성 중인 자기소개서 목록을 확인하고, 새로운 자소서를 추가합니다.
   - AI 피드백을 통해 문항별로 보완할 점을 확인합니다.
5. **AI 면접 시뮬레이션 (`/interview`)**
   - AI와 함께 면접 연습을 진행하고 피드백을 받습니다.
6. **채용 공고 탐색 (`/job-postings`)**
   - 본인에게 맞는 채용 정보를 탐색하고 저장합니다.

## 📂 주요 디렉토리 구조

- `src/pages`: 각 기능별 메인 페이지 컴포넌트
- `src/components`: 레이아웃 및 공통 재사용 컴포넌트
- `src/router`: 앱 전체 라우팅 설정 (`AppRouter.tsx`)
- `src/mocks`: 테스트를 위한 더미 데이터 (`career.ts` 등)
- `src/styles`: 전역 스타일 및 테마 정의
