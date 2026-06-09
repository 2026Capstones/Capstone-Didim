import type {
    CourseGrade,
    CoverLetterDocument,
    InterviewRecord,
    JobPosting,
    PortfolioActivity,
    PortfolioAward,
    PortfolioCertificate,
    PortfolioProject,
    UnfinishedTask,
    UserProfile,
} from '../types/career';

export const userProfile: UserProfile = {
    name: '지수',
    school: '디딤대학교',
    studentId: '20241234',
    department: '컴퓨터공학과',
    grade: '3학년',
    targetRole: '소프트웨어 엔지니어',
};

export const grades: CourseGrade[] = [
    { term: '2026-1', name: '캡스톤디자인2', credit: '3학점', grade: 'A+' },
    { term: '2026-1', name: '클라우드컴퓨팅', credit: '3학점', grade: 'A0' },
    { term: '2026-1', name: '인공지능응용', credit: '3학점', grade: 'A+' },
    { term: '2026-1', name: '정보보호', credit: '3학점', grade: 'B+' },
    { term: '2026-1', name: '기술창업과서비스기획', credit: '3학점', grade: 'A0' },
    { term: '2026-1', name: '오픈소스소프트웨어', credit: '3학점', grade: 'A+' },

    { term: '2025-2', name: '분산시스템', credit: '3학점', grade: 'A0' },
    { term: '2025-2', name: '머신러닝', credit: '3학점', grade: 'B+' },
    { term: '2025-2', name: '웹프레임워크', credit: '3학점', grade: 'A+' },
    { term: '2025-2', name: '컴퓨터그래픽스', credit: '3학점', grade: 'B0' },
    { term: '2025-2', name: '데이터마이닝', credit: '3학점', grade: 'A0' },
    { term: '2025-2', name: '소프트웨어품질관리', credit: '3학점', grade: 'A+' },

    { term: '2025-1', name: '컴퓨터 네트워크', credit: '3학점', grade: 'A0' },
    { term: '2025-1', name: '모바일프로그래밍', credit: '3학점', grade: 'A+' },
    { term: '2025-1', name: '데이터통신', credit: '3학점', grade: 'B+' },
    { term: '2025-1', name: '프로그래밍언어론', credit: '3학점', grade: 'A0' },
    { term: '2025-1', name: '캡스톤디자인1', credit: '3학점', grade: 'A+' },
    { term: '2025-1', name: 'UX/UI 설계', credit: '3학점', grade: 'B+' },

    { term: '2024-2', name: '데이터베이스', credit: '3학점', grade: 'A+' },
    { term: '2024-2', name: '소프트웨어공학', credit: '3학점', grade: 'B+' },
    { term: '2024-2', name: '컴퓨터구조', credit: '3학점', grade: 'A0' },
    { term: '2024-2', name: '확률과통계', credit: '3학점', grade: 'B+' },
    { term: '2024-2', name: '리눅스시스템', credit: '3학점', grade: 'A+' },
    { term: '2024-2', name: '자료구조실습', credit: '2학점', grade: 'A0' },

    { term: '2024-1', name: '알고리즘', credit: '3학점', grade: 'A+' },
    { term: '2024-1', name: '운영체제', credit: '3학점', grade: 'A0' },
    { term: '2024-1', name: '자료구조', credit: '3학점', grade: 'A+' },
    { term: '2024-1', name: '객체지향프로그래밍', credit: '3학점', grade: 'B+' },
    { term: '2024-1', name: '선형대수', credit: '3학점', grade: 'B0' },
    { term: '2024-1', name: '컴퓨터공학세미나', credit: '1학점', grade: 'P' },
];

export const awards: PortfolioAward[] = [
    {
        title: '전국 대학생 프로그래밍 경진대회 은상',
        organization: '한국정보과학회',
        date: '2024.11',
        description: '그래프 탐색과 동적 계획법 문제를 해결하며 팀 내 알고리즘 설계를 담당했습니다.',
    },
    {
        title: '교내 캡스톤 디자인 우수상',
        organization: '컴퓨터공학과',
        date: '2025.05',
        description: '취업 일정 관리 플랫폼을 구현해 실제 사용자 테스트에서 높은 만족도를 얻었습니다.',
    },
    {
        title: '오픈소스 기여 장려상',
        organization: '개발자 커뮤니티',
        date: '2024.07',
        description: '문서화 자동화 도구의 버그 수정과 테스트 케이스 추가에 기여했습니다.',
    },
    {
        title: '교내 해커톤 최우수상',
        organization: '소프트웨어융합대학',
        date: '2025.10',
        description: '팀 매칭과 일정 조율을 돕는 협업 도구 MVP를 24시간 안에 완성했습니다.',
    },
];

export const activities: PortfolioActivity[] = [
    {
        title: '멋쟁이사자처럼 대학',
        role: '운영진',
        period: '2024.03 - 2024.12',
        description: '웹 개발 스터디와 해커톤을 운영하고 신입 부원의 프로젝트 멘토링을 맡았습니다.',
    },
    {
        title: '학과 알고리즘 스터디',
        role: '리더',
        period: '2023.09 - 2025.02',
        description: '주 1회 문제 풀이 세션을 진행하고 난이도별 커리큘럼을 구성했습니다.',
    },
    {
        title: '클라우드 인프라 스터디',
        role: '스터디원',
        period: '2025.03 - 2025.12',
        description: 'Docker, Kubernetes, CI/CD 기초를 학습하고 개인 배포 실습을 진행했습니다.',
    },
    {
        title: '학과 튜터링 프로그램',
        role: '자료구조 튜터',
        period: '2024.09 - 2024.12',
        description: '저학년 학생을 대상으로 자료구조 과제 리뷰와 문제 풀이 세션을 운영했습니다.',
    },
    {
        title: 'AI 서비스 기획 동아리',
        role: '개발 파트',
        period: '2025.09 - 2026.02',
        description: '생성형 AI 기반 학습 보조 서비스의 프로토타입을 설계하고 구현했습니다.',
    },
];

export const certificates: PortfolioCertificate[] = [
    {
        title: 'SQLD',
        issuer: '한국데이터산업진흥원',
        date: '2024.06',
        credentialId: 'SQLD-24-061204',
        description: '데이터 모델링, SQL 기본 및 활용 역량을 검증한 국가공인 데이터베이스 자격입니다.',
    },
    {
        title: '정보처리기사 필기',
        issuer: '한국산업인력공단',
        date: '2025.03',
        credentialId: 'HRDK-25-031188',
        description: '소프트웨어 설계, 개발, 데이터베이스 구축, 정보시스템 운영 기반 지식을 검증했습니다.',
    },
    {
        title: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        date: '2025.08',
        credentialId: 'AWS-CCP-25-8942',
        description: '클라우드 핵심 개념, 보안, 요금, 아키텍처 기본 원리를 학습하고 인증을 취득했습니다.',
    },
    {
        title: 'OPIc IM2',
        issuer: 'ACTFL',
        date: '2024.12',
        credentialId: 'OPIC-IM2-2412',
        description: '기술 협업 상황에서 필요한 기본 영어 커뮤니케이션 역량을 확인했습니다.',
    },
    {
        title: 'Linux Master 2급',
        issuer: '한국정보통신진흥협회',
        date: '2025.01',
        credentialId: 'LM2-2501-7781',
        description: '리눅스 명령어, 시스템 관리, 네트워크 기초를 실습 중심으로 검증했습니다.',
    },
    {
        title: 'ADsP',
        issuer: '한국데이터산업진흥원',
        date: '2025.11',
        credentialId: 'ADSP-25-112940',
        description: '데이터 분석 기획, 통계 분석, 데이터 마이닝 기본 개념을 검증했습니다.',
    },
    {
        title: 'TOEIC Speaking IH',
        issuer: 'ETS',
        date: '2026.02',
        credentialId: 'TS-IH-2602',
        description: '프로젝트 설명과 협업 상황을 영어로 전달하는 말하기 역량을 확인했습니다.',
    },
];

export const projects: PortfolioProject[] = [
    {
        id: 'jobs',
        title: '취업 일정 관리 플랫폼',
        period: '2024.09 - 2024.12',
        stack: 'React, TypeScript, Node.js, PostgreSQL',
        description: '공고 수집, 지원 현황 추적, 일정 관리를 통합한 서비스입니다. 팀 4인 개발에서 FE 리드를 맡았습니다.',
        link: 'GitHub',
    },
    {
        id: 'editor',
        title: '실시간 협업 코드 에디터',
        period: '2024.05 - 2024.08',
        stack: 'React, WebSocket, Express, MongoDB',
        description: 'Google Docs 방식의 실시간 코드 편집 기능을 구현하고 OT 알고리즘을 적용했습니다.',
        link: 'GitHub',
    },
    {
        id: 'market',
        title: '캠퍼스 중고 거래 앱',
        period: '2023.09 - 2024.02',
        stack: 'React Native, Firebase, Expo',
        description: '교내 학생 전용 중고 거래 모바일 앱입니다. 실사용자 340명을 달성했습니다.',
    },
    {
        id: 'extension',
        title: 'AI 요약 크롬 익스텐션',
        period: '2025.01 - 2025.03',
        stack: 'JavaScript, OpenAI API, Chrome Extension API',
        description: '웹페이지 텍스트를 GPT로 요약하는 확장 프로그램으로, 배포 후 350회 이상 설치되었습니다.',
    },
    {
        id: 'portfolio-sync',
        title: 'LMS 포트폴리오 동기화 모듈',
        period: '2025.09 - 2025.12',
        stack: 'TypeScript, REST API, MySQL',
        description: '학점, 수상, 활동 데이터를 정규화해 포트폴리오 화면에 반영하는 mock 동기화 흐름을 구현했습니다.',
    },
    {
        id: 'interview-coach',
        title: 'AI 면접 코칭 도구',
        period: '2026.03 - 2026.05',
        stack: 'React, Web Audio API, OpenAI API',
        description: '답변 녹음, 질문 진행, 피드백 요약을 하나의 흐름으로 테스트할 수 있는 인터뷰 시뮬레이터입니다.',
    },
];

export const coverLetters: CoverLetterDocument[] = [
    {
        id: 'kakao-se',
        title: '카카오 소프트웨어 엔지니어',
        company: '카카오',
        role: '백엔드 개발자',
        updatedAt: '어제 수정',
        updatedAtDaysAgo: 1,
        deadlineDaysLeft: 12,
        status: '작성중',
        progress: 60,
        originalContent: '팀 프로젝트에서 안정적인 API를 설계하고 장애 원인을 추적한 경험을 중심으로 작성했습니다.',
        content:
            '저는 복잡한 문제를 구조화하고 끝까지 해결하는 개발자입니다.\n\n취업 일정 관리 플랫폼 프로젝트에서 공고 수집, 지원 상태 추적, 일정 알림을 하나의 흐름으로 연결했습니다. 특히 Node.js API와 PostgreSQL 스키마 설계를 맡아 팀원이 빠르게 기능을 붙일 수 있는 기반을 만들었습니다.\n\n카카오의 대규모 서비스 환경에서 사용자 행동을 데이터로 이해하고, 안정적인 백엔드 시스템을 만드는 일에 기여하고 싶습니다.',
        feedback: ['성과 수치를 더 앞에 배치하면 임팩트가 커집니다.', '카카오 서비스와 연결되는 동기를 한 문장 더 보강하세요.', '문단 길이를 줄이면 모바일 가독성이 좋아집니다.'],
        questions: [
            { title: '지원 동기', answer: '사용자가 매일 접하는 서비스의 품질을 코드로 개선하는 일에 관심이 있어 지원했습니다.' },
            { title: '가장 어려웠던 기술 문제', answer: '실시간 알림 중복 발송 문제를 로그와 큐 상태를 기준으로 분리해 원인을 찾았습니다.' },
        ],
    },
    {
        id: 'samsung-dx',
        title: '삼성전자 DX부문 지원서',
        company: '삼성전자',
        role: '소프트웨어 엔지니어',
        updatedAt: 'D-4',
        updatedAtDaysAgo: 5,
        deadlineDaysLeft: 4,
        status: '마감 임박',
        progress: 30,
        originalContent: '캡스톤 프로젝트와 네트워크 과목 경험을 기반으로 초안을 작성했습니다.',
        content:
            '제품과 사용자를 연결하는 소프트웨어의 역할에 관심을 갖고 삼성전자 DX부문에 지원했습니다. 학부 과정에서 네트워크와 운영체제 과목을 깊이 있게 학습했고, 캡스톤 프로젝트에서는 사용자의 일정 데이터를 안정적으로 다루는 기능을 구현했습니다.',
        feedback: ['직무 관련 키워드가 부족합니다.', '프로젝트 성과를 수치로 보강하세요.'],
        questions: [{ title: '직무 역량', answer: 'React와 Node.js 기반의 서비스 개발 경험, DB 모델링 경험이 있습니다.' }],
    },
    {
        id: 'naver-cloud',
        title: '네이버클라우드 인턴 지원서',
        company: '네이버클라우드',
        role: '플랫폼 개발 인턴',
        updatedAt: '3일 전',
        updatedAtDaysAgo: 3,
        deadlineDaysLeft: 8,
        status: 'AI 첨삭 완료',
        progress: 92,
        originalContent: '클라우드 운영 자동화에 관심을 갖게 된 경험을 중심으로 정리했습니다.',
        content:
            '클라우드 환경에서 반복되는 운영 문제를 소프트웨어로 줄이는 일에 관심이 있습니다. 협업 코드 에디터 프로젝트에서 WebSocket 연결 상태와 문서 동기화 충돌을 다루며 분산 환경에서의 상태 관리 중요성을 배웠습니다.',
        feedback: ['직무 적합성이 명확합니다.', '마지막 문단에 입사 후 기여 계획을 추가하면 좋습니다.'],
        questions: [{ title: '성장 경험', answer: '협업 도구를 만들며 동시성 문제를 직접 디버깅한 경험이 가장 크게 성장한 순간이었습니다.' }],
    },
    {
        id: 'toss-fe',
        title: '토스 프론트엔드 어시스턴트',
        company: '비바리퍼블리카',
        role: 'Frontend Developer Assistant',
        updatedAt: '오늘 수정',
        updatedAtDaysAgo: 0,
        deadlineDaysLeft: 20,
        status: '검토 필요',
        progress: 72,
        originalContent: '디자인 시스템과 사용자 경험 개선 프로젝트를 중심으로 작성했습니다.',
        content:
            '작은 인터랙션이 사용자의 신뢰를 만든다고 생각합니다. 캡스톤 프로젝트에서 폼 입력 오류와 일정 알림 상태를 명확하게 보여주는 UI를 개선했고, 사용자 테스트에서 작업 완료율이 높아지는 것을 확인했습니다.',
        feedback: ['토스 제품 경험과 연결되는 구체 사례를 추가하세요.', '프론트엔드 성능 개선 경험을 한 문단 보강하면 좋습니다.'],
        questions: [{ title: '협업 경험', answer: '디자이너와 매일 짧은 리뷰를 진행하며 컴포넌트 상태와 예외 케이스를 정리했습니다.' }],
    },
];

export const unfinishedTasks: UnfinishedTask[] = [
    { type: '자소서', title: '카카오 소프트웨어 엔지니어', subtitle: '3/5 항목 작성 중', progress: 60, action: '이어서 작성', path: '/cover-letters/kakao-se' },
    { type: 'AI 면접', title: '백엔드 개발자 모의 면접 2회차', subtitle: '피드백 미확인', progress: 85, action: '피드백 확인', path: '/interview' },
    { type: '지원서', title: '삼성전자 DX부문 지원서', subtitle: '지원서 작성 미완료, 마감 D-4', progress: 30, action: '이어서 작성', path: '/cover-letters/samsung-dx' },
    { type: '자소서', title: '토스 프론트엔드 어시스턴트', subtitle: 'AI 첨삭 후 문항 2개 수정 필요', progress: 72, action: '수정하기', path: '/cover-letters/toss-fe' },
];

export const interviews: InterviewRecord[] = [
    { title: '백엔드 개발자 모의 면접 2회차', date: '2026.06.03', score: 85, summary: 'API 설계 질문에는 강했지만 장애 대응 답변은 더 구체화가 필요합니다.' },
    { title: '인성 면접 기본 질문', date: '2026.05.29', score: 78, summary: '협업 경험은 좋았고, 갈등 해결 과정의 역할 설명을 보강하면 좋습니다.' },
    { title: '프론트엔드 직무 면접', date: '2026.05.21', score: 82, summary: '상태 관리와 접근성 답변은 좋았고, 성능 최적화 사례를 더 준비하면 좋습니다.' },
    { title: '클라우드 인턴 기술 면접', date: '2026.05.10', score: 74, summary: '컨테이너 개념은 설명했지만 운영 경험과 장애 대응 흐름이 부족했습니다.' },
];

export const jobPostings: JobPosting[] = [
    { id: 'j1', company: '카카오', title: 'Software Engineer, Backend', location: '판교', deadline: 'D-12', match: 91, tags: ['Java', 'Spring', '대용량 트래픽'], saved: true },
    { id: 'j2', company: '네이버클라우드', title: 'Platform Engineer Intern', location: '분당', deadline: 'D-8', match: 87, tags: ['Kubernetes', 'Go', 'Cloud'] },
    { id: 'j3', company: '삼성전자', title: 'DX부문 SW Engineer', location: '수원', deadline: 'D-4', match: 82, tags: ['C++', 'Linux', 'Embedded'], applied: true },
    { id: 'j4', company: '토스', title: 'Frontend Developer Assistant', location: '서울', deadline: 'D-20', match: 79, tags: ['React', 'TypeScript', 'Design System'] },
    { id: 'j5', company: '라인플러스', title: 'Server Engineer Intern', location: '성남', deadline: 'D-15', match: 84, tags: ['Kotlin', 'MySQL', 'MSA'], saved: true },
    { id: 'j6', company: '우아한형제들', title: '웹 프론트엔드 개발자', location: '서울', deadline: 'D-18', match: 80, tags: ['React', 'Next.js', 'Testing'] },
    { id: 'j7', company: '당근', title: 'Software Engineer Intern', location: '서울', deadline: 'D-6', match: 77, tags: ['TypeScript', 'Node.js', 'Product'] },
    { id: 'j8', company: '현대오토에버', title: 'SW Engineer', location: '서울/판교', deadline: 'D-10', match: 75, tags: ['Java', 'Linux', 'Mobility'] },
];

export const getCoverLetterById = (id: string) => coverLetters.find((item) => item.id === id);
