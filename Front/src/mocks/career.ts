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
    name: '김철수',
    school: '디딤대학교',
    studentId: 'student-001',
    department: '컴퓨터공학과',
    grade: '3학년',
    targetRole: '소프트웨어 엔지니어',
};

export const grades: CourseGrade[] = [];
export const awards: PortfolioAward[] = [];
export const activities: PortfolioActivity[] = [];
export const certificates: PortfolioCertificate[] = [];
export const projects: PortfolioProject[] = [];

export const coverLetters: CoverLetterDocument[] = [];
export const unfinishedTasks: UnfinishedTask[] = [];
export const interviews: InterviewRecord[] = [];
export const jobPostings: JobPosting[] = [];

export const getCoverLetterById = (id: string) => coverLetters.find((item) => item.id === id);
