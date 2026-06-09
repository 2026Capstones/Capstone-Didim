import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobPostings } from '../mocks/career';
import type { JobPosting } from '../types/career';
import { formatDdayFromDaysLeft, getDaysFromDdayText } from '../utils/date';
import './CoverLetters.css';

type JobTab = 'all' | 'saved' | 'recent';

const JOBS_PER_PAGE = 5;
const RECENT_VIEWED_JOB_IDS = ['j4', 'j2', 'j7', 'j1'];
const SAVED_JOBS_STORAGE_KEY = 'didim:saved-job-ids';

const jobTabs: Array<{ id: JobTab; label: string }> = [
    { id: 'all', label: '전체 공고' },
    { id: 'saved', label: '관심 공고' },
    { id: 'recent', label: '최근 본 공고' },
];

const matchingLabels = [
    '직무 적합도',
    '경력/경험 일치도',
    '자격증 충족도',
    '학력 충족도',
    '포트폴리오/프로젝트 적합도',
    '우대사항 충족도',
];

function parseDeadline(deadline: string) {
    return getDaysFromDdayText(deadline) || 999;
}

function getStoredSavedJobIds() {
    try {
        const rawValue = window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY);

        if (!rawValue) {
            return jobPostings.filter((job) => job.saved).map((job) => job.id);
        }

        return JSON.parse(rawValue) as string[];
    } catch {
        return jobPostings.filter((job) => job.saved).map((job) => job.id);
    }
}

function getJobMatchingScores(job: JobPosting) {
    return matchingLabels.map((label, index) => ({
        label,
        score: Math.max(45, Math.min(98, job.match - index * 4 + (index % 2 === 0 ? 3 : -2))),
    }));
}

function getJobDetailDescription(job: JobPosting) {
    return `${job.company}의 ${job.title} 포지션은 ${job.tags.join(', ')} 역량을 중심으로 지원자의 직무 이해도와 프로젝트 경험을 확인합니다. 포트폴리오의 기술 스택, 활동 이력, 자격 요건을 기준으로 매칭률을 산정하며, 실제 공고 원문 연동 후에는 상세 자격 요건과 우대사항이 이 영역에 표시됩니다.`;
}

function JobPostingsPage() {
    const [keyword, setKeyword] = useState('');
    const [region, setRegion] = useState('all');
    const [sortBy, setSortBy] = useState('match');
    const [activeTab, setActiveTab] = useState<JobTab>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [savedJobIds, setSavedJobIds] = useState(() => new Set(getStoredSavedJobIds()));
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const recommendedIds = useMemo(() => new Set(jobPostings.slice(0, 2).map((job) => job.id)), []);
    const recentViewedIds = useMemo(() => new Set(RECENT_VIEWED_JOB_IDS), []);
    const baseFilteredJobs = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        return jobPostings.filter((job) => {
            const matchesKeyword = !normalizedKeyword
                || job.company.toLowerCase().includes(normalizedKeyword)
                || job.title.toLowerCase().includes(normalizedKeyword)
                || job.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword));
            const matchesRegion = region === 'all'
                || ['서울', '경기', '판교', '분당', '수원', '성남'].some((area) => job.location.includes(area));

            return matchesKeyword && matchesRegion;
        });
    }, [keyword, region]);
    const tabCounts: Record<JobTab, number> = {
        all: baseFilteredJobs.length,
        saved: baseFilteredJobs.filter((job) => savedJobIds.has(job.id)).length,
        recent: baseFilteredJobs.filter((job) => recentViewedIds.has(job.id)).length,
    };

    const filteredJobs = useMemo(() => {
        return [...baseFilteredJobs]
            .filter((job) => {
                const matchesTab = activeTab === 'all'
                    || (activeTab === 'saved' && savedJobIds.has(job.id))
                    || (activeTab === 'recent' && recentViewedIds.has(job.id));

                return matchesTab;
            })
            .sort((a, b) => {
                const recommendedDiff = Number(recommendedIds.has(b.id)) - Number(recommendedIds.has(a.id));

                if (recommendedDiff !== 0) {
                    return recommendedDiff;
                }

                if (activeTab === 'recent') {
                    return RECENT_VIEWED_JOB_IDS.indexOf(a.id) - RECENT_VIEWED_JOB_IDS.indexOf(b.id);
                }

                if (sortBy === 'deadline') {
                    return parseDeadline(a.deadline) - parseDeadline(b.deadline);
                }

                return b.match - a.match;
            });
    }, [activeTab, baseFilteredJobs, recentViewedIds, recommendedIds, savedJobIds, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
    const activePage = Math.min(currentPage, totalPages);
    const pagedJobs = filteredJobs.slice((activePage - 1) * JOBS_PER_PAGE, activePage * JOBS_PER_PAGE);
    const toggleSavedJob = (jobId: string) => {
        setSavedJobIds((previousIds) => {
            const nextIds = new Set(previousIds);

            if (nextIds.has(jobId)) {
                nextIds.delete(jobId);
            } else {
                nextIds.add(jobId);
            }

            window.localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify(Array.from(nextIds)));
            return nextIds;
        });
    };

    return (
        <section className="simple-page jobs-page">
            <div className="simple-page-header">
                <div className="page-breadcrumb-title">
                    <Link to="/home">‹ 메인으로</Link>
                    <span>/</span>
                    <h1>채용공고</h1>
                </div>
                <p>포트폴리오와 지원 현황을 기준으로 맞춤 공고를 탐색하고 저장해보세요.</p>
            </div>

            <section className="jobs-search-panel">
                <label className="jobs-search-main">
                    <span>공고 검색</span>
                    <input
                        value={keyword}
                        onChange={(event) => {
                            setKeyword(event.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="회사, 직무, 기술을 검색하세요"
                    />
                </label>
                <div className="jobs-filter-row">
                    <label>
                        <span>지역</span>
                        <select
                            value={region}
                            onChange={(event) => {
                                setRegion(event.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="all">전체</option>
                            <option value="capital">서울/경기</option>
                        </select>
                    </label>
                    <label>
                        <span>정렬</span>
                        <select
                            value={sortBy}
                            onChange={(event) => {
                                setSortBy(event.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="match">매칭 높은순</option>
                            <option value="deadline">마감 임박순</option>
                        </select>
                    </label>
                </div>
            </section>

            <div className="jobs-layout">
                <section className="job-list">

                    <div className="jobs-tabs" role="tablist" aria-label="공고 목록 필터">
                        {jobTabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={activeTab === tab.id ? 'is-active' : undefined}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setCurrentPage(1);
                                }}
                            >
                                {tab.label}({tabCounts[tab.id]})
                            </button>
                        ))}
                    </div>

                    {pagedJobs.length > 0 ? (
                        pagedJobs.map((job) => {
                            const isRecommended = recommendedIds.has(job.id);

                            return (
                                <article key={job.id} className={`job-card${isRecommended ? ' featured' : ''}`}>
                                    <div className="job-main">
                                        <button
                                            type="button"
                                            className={`job-star-button${savedJobIds.has(job.id) ? ' is-saved' : ''}`}
                                            aria-label={savedJobIds.has(job.id) ? '관심 공고에서 삭제' : '관심 공고에 추가'}
                                            onClick={() => toggleSavedJob(job.id)}
                                        >
                                            ★
                                        </button>
                                        <div>
                                            <div className="job-title-row">
                                                <h3>{job.company}</h3>
                                                {isRecommended && <span className="recommended-label">추천</span>}
                                            </div>
                                            <p>{job.title}</p>
                                            <small>{job.location} · {formatDdayFromDaysLeft(getDaysFromDdayText(job.deadline))}</small>
                                            <div>{job.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                                        </div>
                                    </div>
                                    <div className="job-actions">
                                        <button type="button" className="job-detail-button" onClick={() => setSelectedJob(job)}>
                                            자세히
                                        </button>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="job-empty-state">조건에 맞는 공고가 없습니다.</div>
                    )}

                    <div className="jobs-pagination" aria-label="공고 페이지 이동">
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                className={activePage === page ? 'is-active' : undefined}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            {selectedJob && (
                <div className="modal-backdrop" role="presentation">
                    <section className="modal-card job-detail-modal" role="dialog" aria-modal="true" aria-labelledby="job-detail-title">
                        <div className="job-detail-top">
                            <div className="job-detail-summary">
                                <span className="job-detail-kicker">공고 기본 정보</span>
                                <h2 id="job-detail-title">{selectedJob.company}</h2>
                                <strong>{selectedJob.title}</strong>
                                <div className="job-detail-meta">
                                    <span>{selectedJob.location}</span>
                                    <span>{formatDdayFromDaysLeft(getDaysFromDdayText(selectedJob.deadline))}</span>
                                    <span>전체 매칭률 {selectedJob.match}%</span>
                                </div>
                                <div className="job-detail-tags">
                                    {selectedJob.tags.map((tag) => <span key={tag}>{tag}</span>)}
                                </div>
                            </div>

                            <div className="job-match-panel">
                                <div className="job-match-panel-title">
                                    <span>포트폴리오 매칭률</span>
                                    <strong>{selectedJob.match}%</strong>
                                </div>
                                <div className="job-match-grid">
                                    {getJobMatchingScores(selectedJob).map((item) => (
                                        <div className="job-match-item" key={item.label}>
                                            <div>
                                                <span>{item.label}</span>
                                                <strong>{item.score}%</strong>
                                            </div>
                                            <div className="job-match-bar" aria-hidden="true">
                                                <span style={{ width: `${item.score}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="job-detail-body">
                            <h3>공고 상세 정보</h3>
                            <p>{getJobDetailDescription(selectedJob)}</p>
                            <div className="job-detail-section-grid">
                                <article>
                                    <strong>주요 업무</strong>
                                    <p>서비스 요구사항을 분석하고 안정적인 기능 구현, 성능 개선, 협업 기반 개발을 수행합니다.</p>
                                </article>
                                <article>
                                    <strong>자격 요건</strong>
                                    <p>{selectedJob.tags.join(', ')} 관련 학습 또는 프로젝트 경험과 문제 해결 역량을 확인합니다.</p>
                                </article>
                                <article>
                                    <strong>우대 사항</strong>
                                    <p>실제 사용자 문제를 정의하고 포트폴리오 또는 팀 프로젝트로 개선한 경험을 우대합니다.</p>
                                </article>
                            </div>
                        </div>

                        <div className="job-detail-footer">
                            <button type="button" className="secondary-action-button" onClick={() => setSelectedJob(null)}>닫기</button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

export default JobPostingsPage;
