import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import didimHeroScene from '../assets/didim-hero-scene.svg';
import runnerPortfolio from '../assets/img1.png';
import runnerCoverLetter from '../assets/img2.png';
import runnerInterview from '../assets/img3.png';
import runnerJobs from '../assets/img4.png';
import { activities, awards, certificates, projects, unfinishedTasks, userProfile } from '../mocks/career';
import { formatDdayFromDaysLeft, getDaysFromDdayText } from '../utils/date';
import './HomePage.css';

type SyncState = 'idle' | 'syncing' | 'done';

const PORTFOLIO_SYNC_STORAGE_KEY = 'didim:portfolio-sync-state';

function formatTaskSubtitle(subtitle: string) {
    return subtitle.replace(/D-\d+/g, (value) => formatDdayFromDaysLeft(getDaysFromDdayText(value)));
}

function getTaskMeta(subtitle: string) {
    const formattedSubtitle = formatTaskSubtitle(subtitle);

    return formattedSubtitle.includes('D-') || formattedSubtitle.includes('D-Day')
        ? formattedSubtitle.split(', ').at(-1) || formattedSubtitle
        : formattedSubtitle;
}

function formatDeadlineStatus(subtitle: string) {
    const match = subtitle.match(/D-\d+/);

    if (!match) {
        return null;
    }

    const daysLeft = getDaysFromDdayText(match[0]);

    if (daysLeft === 0) {
        return '오늘 마감';
    }

    return `마감 ${daysLeft}일 남음`;
}

function getTaskDisplay(task: (typeof unfinishedTasks)[number]) {
    const deadlineStatus = formatDeadlineStatus(task.subtitle);

    if (deadlineStatus) {
        return {
            rank: 1,
            badge: '긴급',
            variant: 'urgent',
            status: deadlineStatus,
            cta: '제출 마무리',
            description: '작성이 아직 완료되지 않았어요. 오늘 마무리하면 제출 전 검토 시간을 확보할 수 있어요.',
            meta: '예상 15분',
        };
    }

    if (task.type === 'AI 면접') {
        return {
            rank: 2,
            badge: '확인 필요',
            variant: 'review',
            status: '피드백이 도착했어요',
            cta: '피드백 확인',
            description: '답변 평가와 개선 포인트를 확인하고 다음 연습에 반영해보세요.',
            meta: '최근 2일 전',
        };
    }

    if (task.progress >= 60) {
        return {
            rank: 3,
            badge: '곧 완료 가능',
            variant: 'almost',
            status: '문항 2개만 더 쓰면 완료',
            cta: '문항 이어쓰기',
            description: '남은 문항만 정리하면 자소서 초안을 완성할 수 있어요.',
            meta: '최근 어제 수정',
        };
    }

    return {
        rank: 5,
        badge: '진행 중',
        variant: 'normal',
        status: getTaskMeta(task.subtitle),
        cta: '다시 열기',
        description: formatTaskSubtitle(task.subtitle),
        meta: '진행 중',
    };
}

const quickLinks = [
    { title: '포트폴리오', subtitle: '나의 경력 및 성과를 한눈에', path: '/portfolio', icon: 'grid' },
    { title: 'AI 자소서', subtitle: 'AI가 해주는 자소서 첨삭', path: '/cover-letters', icon: 'doc' },
    { title: 'AI 면접', subtitle: 'AI와의 모의 면접 시뮬레이션', path: '/interview', icon: 'mic' },
    { title: '채용공고', subtitle: '맞춤 공고 탐색', path: '/job-postings', icon: 'bag' },
];

const syncItems = [
    { label: '학점 정보', section: 'grades', icon: 'grad' },
    { label: '수상 내역', section: 'awards', icon: 'award' },
    { label: '자격증', section: 'certificates', icon: 'doc' },
    { label: '활동 / 동아리', section: 'activities', icon: 'activity' },
    { label: '프로젝트', section: 'projects', icon: 'folder' },
];

function Icon({ name }: { name: string }) {
    if (name === 'refresh') {
        return (
            <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 8.5V4.5H15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.5 10.2A6.6 6.6 0 0 1 17.9 7.2L19 8.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 15.5V19.5H9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 13.8A6.6 6.6 0 0 1 6.1 16.8L5 15.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }

    if (name === 'spinner') {
        return (
            <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 12A7 7 0 1 1 12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    if (name === 'check-circle') {
        return (
            <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.9" />
                <path d="M8.8 12.2L10.9 14.3L15.4 9.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }

    if (name === 'doc') {
        return (
            <svg viewBox="0 0 24 24" fill="none">
                <path d="M8 4H14L18 8V20H8C6.9 20 6 19.1 6 18V6C6 4.9 6.9 4 8 4Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M14 4V8H18" stroke="currentColor" strokeWidth="1.8" />
                <path d="M9 13H15M9 16H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        );
    }

    if (name === 'mic') {
        return (
            <svg viewBox="0 0 24 24" fill="none">
                <rect x="9" y="4" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M6 11C6 14.3 8.7 17 12 17M12 17C15.3 17 18 14.3 18 11M12 17V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        );
    }

    if (name === 'bag') {
        return (
            <svg viewBox="0 0 24 24" fill="none">
                <rect x="5" y="7" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M9 7V6C9 4.9 9.9 4 11 4H13C14.1 4 15 4.9 15 6V7" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        );
    }

    if (name === 'folder') {
        return (
            <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 7.5C4 6.7 4.7 6 5.5 6H10L12 8H18.5C19.3 8 20 8.7 20 9.5V17.5C20 18.3 19.3 19 18.5 19H5.5C4.7 19 4 18.3 4 17.5V7.5Z" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" fill="none">
            <rect x="5" y="5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <rect x="14" y="5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <rect x="5" y="14" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <rect x="14" y="14" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    );
}

const runnerImages = [
    runnerPortfolio,
    runnerCoverLetter,
    runnerInterview,
    runnerJobs,
];


function HomePage() {
    const navigate = useNavigate();
    const [syncState, setSyncState] = useState<SyncState>(() =>
        window.localStorage.getItem(PORTFOLIO_SYNC_STORAGE_KEY) === 'done' ? 'done' : 'idle'
    );
    const [resumes, setResumes] = useState<any[]>([]);
    const [interviewsList, setInterviewsList] = useState<any[]>([]);
    const [userName, setUserName] = useState('지수');
    const [portfolioStats, setPortfolioStats] = useState({
        gpa: '0.0',
        awardsCount: 0,
        certificatesCount: 0,
        activitiesCount: 0,
        projectsCount: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
            try {
                const [resumeRes, interviewRes, portfolioRes] = await Promise.all([
                    fetch('/api/resume/list', { headers }),
                    fetch('/api/interview/list', { headers }),
                    fetch('/api/portfolio', { headers })
                ]);
                
                if (resumeRes.ok) {
                    const data = await resumeRes.json();
                    setResumes(data.data || []);
                }
                if (interviewRes.ok) {
                    const data = await interviewRes.json();
                    setInterviewsList(data.data || []);
                }
                if (portfolioRes.ok) {
                    const data = await portfolioRes.json();
                    if (data.data) {
                        if (data.data.user && data.data.user.name) {
                            setUserName(data.data.user.name);
                        }
                        setPortfolioStats({
                            gpa: data.data.gpa || '0.0',
                            awardsCount: data.data.awards?.length || 0,
                            certificatesCount: data.data.certifications?.length || 0,
                            activitiesCount: data.data.volunteer?.length || 0,
                            projectsCount: data.data.projects?.length || 0
                        });
                    }
                }
            } catch (error) {
                console.error('Fetch dashboard data error:', error);
            }
        };
        fetchData();
    }, []);

    // 실제 데이터를 바탕으로 task 생성
    const realTasks = useMemo(() => {
        const list = [];
        if (resumes.length > 0) {
            list.push({
                type: 'AI 자소서',
                title: `${resumes[0].companyName} 지원서`,
                subtitle: 'D-Day, 작성 중',
                progress: 80,
                path: `/cover-letters/${resumes[0].jobId}`
            });
        }
        if (interviewsList.length > 0) {
            list.push({
                type: 'AI 면접',
                title: `${interviewsList[0].companyName} 면접 연습`,
                subtitle: '피드백 도착함',
                progress: 100,
                path: '/interview'
            });
        }
        // 데이터가 없으면 기본값 보이기 (기능 유지)
        return list.length > 0 ? list : unfinishedTasks;
    }, [resumes, interviewsList]);

    const prioritizedTasks = realTasks
        .map((task) => ({ task, display: getTaskDisplay(task as any) }))
        .sort((a, b) => a.display.rank - b.display.rank || b.task.progress - a.task.progress);
    const heroTask = prioritizedTasks[0];
    const supportingTasks = prioritizedTasks.slice(1, 3);

    const startSync = async () => {
        if (syncState === 'syncing') return;

        setSyncState('syncing');
        try {
            const response = await fetch('/api/portfolio/lms', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            if (response.ok) {
                window.localStorage.setItem(PORTFOLIO_SYNC_STORAGE_KEY, 'done');
                setSyncState('done');
            } else {
                setSyncState('idle');
            }
        } catch (error) {
            console.error('LMS sync error:', error);
            setSyncState('idle');
        }
    };

    const isSynced = syncState === 'done';
    const isSyncing = syncState === 'syncing';

    return (
        <section className={`home-page ${isSynced ? 'is-synced' : ''}`}>
            <div className="home-composition">
                <aside className={`sync-card sync-card-${syncState}`}>
                    <div className="sync-card-top">
                        <div>
                            <span className="dot-label">{isSynced ? '동기화 완료' : isSyncing ? '동기화 중...' : '연동 전'}</span>
                            <h2>학교 포트폴리오 동기화</h2>
                        </div>
                        <button type="button" aria-label="동기화 상태" className="icon-button">
                            <Icon name={isSynced ? 'check-circle' : isSyncing ? 'spinner' : 'refresh'} />
                        </button>
                    </div>

                    <div className="sync-list">
                        {syncItems.map((item) => (
                            <button key={item.label} type="button" onClick={() => navigate(`/portfolio/${item.section}`)}>
                                <span className="sync-item-label">
                                    <span className="sync-item-icon"><Icon name={item.icon} /></span>
                                    {item.label}
                                </span>
                                {(isSyncing || isSynced) && (
                                    <i>
                                        {isSynced && <Icon name="check-circle" />}
                                    </i>
                                )}
                            </button>
                        ))}
                    </div>

                    {isSynced && <p className="sync-time">방금 전 동기화됨</p>}
                    <button type="button" className="primary-wide" onClick={startSync} disabled={isSyncing}>
                        {(isSynced || isSyncing) && (
                            <span className="button-status-icon" aria-hidden="true">
                                <Icon name={isSynced ? 'check-circle' : 'spinner'} />
                            </span>
                        )}
                        {isSynced ? '동기화 완료' : isSyncing ? '동기화 중...' : '학교 정보 동기화'}
                    </button>
                    <Link to="/portfolio" className="sub-link">가져온 항목 보기 ›</Link>
                </aside>

                {quickLinks.map((link, index) => (
                    <Link
                        key={link.title}
                        to={link.path}
                        className={`quick-nav-item composition-nav-item composition-nav-${index}`}
                    >
                        <span className="nav-icon"><Icon name={link.icon} /></span>
                        <span>
                            <strong>{link.title}</strong>
                            {link.subtitle && <small>{link.subtitle}</small>}
                        </span>
                        <b>›</b>
                    </Link>
                ))}

                <div className="student-panel">
                    <p>안녕하세요,</p>
                    <h1>{userName}님의 커리어 대시보드</h1>
                    <span className="student-hero-copy">
                        학교 기록부터<br />
                        자소서,<br />
                        면접,<br />
                        공고 탐색까지<br />
                        한 곳에서<br />
                        관리하세요.
                    </span>

                    <div className="home-sketch-character" aria-hidden="true">
                        <img src={didimHeroScene} alt="" />
                    </div>

                    <div className="student-card">
                        <div className="student-avatar">{userName[0]}</div>
                        <div>
                            <strong>
                                {userName}
                                {isSynced && <span className="sync-badge">◎ LMS 연동됨</span>}
                            </strong>
                            <p className="student-school-line">{userProfile.school} <span /> {userProfile.studentId}</p>
                            <p>{userProfile.department} <span /> {userProfile.grade} <span /> {userProfile.targetRole}</p>
                        </div>
                    </div>

                    <div className="portfolio-stat-grid">
                        <Link to="/portfolio/grades"><Icon name="grad" /><strong>{isSynced ? `${portfolioStats.gpa} / 4.5` : '- / -'}</strong><span>학점</span></Link>
                        <Link to="/portfolio/awards"><Icon name="award" /><strong>{isSynced ? `${portfolioStats.awardsCount}건` : '-건'}</strong><span>수상 내역</span></Link>
                        <Link to="/portfolio/certificates"><Icon name="doc" /><strong>{isSynced ? `${portfolioStats.certificatesCount}건` : '-건'}</strong><span>자격증</span></Link>
                        <Link to="/portfolio/activities"><Icon name="activity" /><strong>{isSynced ? `${portfolioStats.activitiesCount}건` : '-건'}</strong><span>활동 / 동아리</span></Link>
                        <Link to="/portfolio/projects"><Icon name="folder" /><strong>{isSynced ? `${portfolioStats.projectsCount}개` : '-개'}</strong><span>프로젝트</span></Link>
                    </div>
                </div>
            </div>

            <section className="quick-nav-shell" aria-label="주요 콘텐츠">
                <nav className="quick-nav">
                    {quickLinks.map((link, index) => (
                        <Link key={link.title} to={link.path} className="quick-nav-item">
                            <span className="hover-runner">
                                <img src={runnerImages[index]} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                            </span>
                            <span className="nav-icon"><Icon name={link.icon} /></span>
                            <span>
                                <strong>{link.title}</strong>
                                {link.subtitle && <small>{link.subtitle}</small>}
                            </span>
                            <b>›</b>
                        </Link>
                    ))}
                </nav>
            </section>

            <div className="home-lower-grid">
                <section>
                    <div className="section-heading">
                        <h2>지금 먼저 할 일</h2>
                    </div>
                    <div className="priority-task-list">
                        {heroTask && (
                            <article className={`priority-task-card priority-task-hero priority-${heroTask.display.variant}`}>
                                <div className="priority-task-topline">
                                    <span className="priority-badge">{heroTask.display.badge}</span>
                                    <strong>{heroTask.display.status}</strong>
                                </div>
                                <h3>{heroTask.task.title}</h3>
                                <p>{heroTask.display.description}</p>
                                <div className="priority-task-footer">
                                    <Link to={heroTask.task.path} className="priority-task-action">{heroTask.display.cta}</Link>
                                </div>
                            </article>
                        )}

                        <div className="priority-support-list">
                            {supportingTasks.map(({ task, display }) => (
                                <article key={task.title} className={`priority-task-card priority-task-support priority-${display.variant}`}>
                                    <div className="priority-task-support-header">
                                        <h3>{task.title}</h3>
                                        <span className="priority-badge">{display.badge}</span>
                                    </div>
                                    <strong>{display.status}</strong>
                                    <p>{display.description}</p>
                                    <div className="priority-task-footer">
                                        <Link to={task.path} className="priority-task-action secondary">{display.cta}</Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <aside className="status-panel">
                    <h2>취업 준비 현황</h2>
                    <div className="status-card">
                        <strong>자소서 최근 점수</strong>
                        <p>자소서를 업로드하면 AI 첨삭 결과가 표시돼요</p>
                    </div>
                    <div className="status-card">
                        <strong>AI 면접 점수</strong>
                        <p>AI 면접을 시작하면 점수가 표시돼요</p>
                    </div>
                    <div className="status-mini-grid">
                        <div><strong>0</strong><span>저장한 공고</span></div>
                        <div><strong>0</strong><span>지원 기업</span></div>
                    </div>
                    <div className="status-card">
                        <strong>포트폴리오 동기화</strong>
                        <p>{isSynced ? '방금 전 동기화되었습니다' : '아직 동기화 전입니다'}</p>
                    </div>
                </aside>
            </div>
        </section>
    );
}

export default HomePage;
