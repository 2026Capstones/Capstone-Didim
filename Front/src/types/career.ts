export interface UserProfile {
    name: string;
    school: string;
    studentId: string;
    department: string;
    grade: string;
    targetRole: string;
}

export interface CourseGrade {
    term: string;
    name: string;
    credit: string;
    grade: string;
}

export interface PortfolioProject {
    id: string;
    title: string;
    period: string;
    stack: string;
    description: string;
    link?: string;
}

export interface PortfolioAward {
    title: string;
    organization: string;
    date: string;
    description: string;
}

export interface PortfolioActivity {
    title: string;
    role: string;
    period: string;
    description: string;
}

export interface PortfolioCertificate {
    title: string;
    issuer: string;
    date: string;
    credentialId: string;
    description: string;
}

export interface CoverLetterDocument {
    id: string;
    title: string;
    company: string;
    role: string;
    updatedAt: string;
    updatedAtIso?: string;
    updatedAtDaysAgo: number;
    deadlineDaysLeft: number;
    status: string;
    progress: number;
    content: string;
    originalContent: string;
    feedback: string[];
    questions: Array<{
        title: string;
        answer: string;
    }>;
}

export interface UnfinishedTask {
    type: string;
    title: string;
    subtitle: string;
    progress: number;
    action: string;
    path: string;
}

export interface InterviewRecord {
    title: string;
    date: string;
    score: number;
    summary: string;
}

export interface JobPosting {
    id: string;
    company: string;
    title: string;
    location: string;
    deadline: string;
    match: number;
    tags: string[];
    saved?: boolean;
    applied?: boolean;
}
