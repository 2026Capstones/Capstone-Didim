import { useMemo, useState, useEffect } from 'react';
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

function parseDeadline(deadline: string) {
    return getDaysFromDdayText(deadline) || 999;
}

function getStoredSavedJobIds() {
    try {
        const rawValue = window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY);

        if (!rawValue) {
            return []; // 더미 데이터 삭제로 인해 빈 배열 반환
        }

        return JSON.parse(rawValue) as string[];
    } catch {
        return [];
    }
}

function JobPostingsPage() {
    const [keyword, setKeyword] = useState('');
    const [region, setRegion] = useState('all');
    const [sortBy, setSortBy] = useState('match');
    const [activeTab, setActiveTab] = useState<JobTab>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [savedJobIds, setSavedJobIds] = useState(() => new Set(getStoredSavedJobIds()));
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [jobItems, setJobItems] = useState<JobPosting[]>([]);
    
    // 로딩 및 매칭 결과 상태
    const [isLoading, setIsLoading] = useState(true);
    const [matchDetails, setMatchDetails] = useState<any>(null);
    const [isMatching, setIsMatching] = useState(false);

    useEffect(() => {
        if (!selectedJob) {
            setMatchDetails(null);
            return;
        }

        const fetchMatchScore = async () => {
            setIsMatching(true);
            try {
                const response = await fetch(`/api/match/calculate/${selectedJob.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMatchDetails(data.data);
                }
            } catch (error) {
                console.error('Match error:', error);
            } finally {
                setIsMatching(false);
            }
        };

        fetchMatchScore();
    }, [selectedJob]);

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/job-postings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.data) {
                    const mappedJobs = data.data.map((job: any) => ({
                        id: job.jobId,
                        company: job.companyName,
                        title: job.jobTitle,
                        location: '-',
                        deadline: job.deadline ? String(job.deadline) : '상시채용',
                        match: 0, // 매칭 점수는 모달에서 별도 계산
                        tags: [],
                        saved: false,
                        description: job.description,
                        requirements: job.requirements
                    }));
                    setJobItems(mappedJobs);
                }
            }
        } catch (error) {
            console.error('Fetch jobs error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const recommendedIds = useMemo(() => new Set(jobItems.slice(0, 2).map((job) => job.id)), [jobItems]);
    const recentViewedIds = useMemo(() => new Set(RECENT_VIEWED_JOB_IDS), []);
    const baseFilteredJobs = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        return jobItems.filter((job) => {
            const matchesKeyword = !normalizedKeyword
                || job.company.toLowerCase().includes(normalizedKeyword)
                || job.title.toLowerCase().includes(normalizedKeyword)
                || (job.tags && job.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword)));
            const matchesRegion = region === 'all'
                || ['서울', '경기', '판교', '분당', '수원', '성남'].some((area) => job.location.includes(area));

            return matchesKeyword && matchesRegion;
        });
    }, [keyword, region, jobItems]);
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>공고 검색</span>
                        <button 
                            type="button" 
                            onClick={() => fetchJobs()} 
                            disabled={isLoading}
                            className="secondary-action-button"
                            style={{ 
                                height: '32px', 
                                padding: '0 10px', 
                                fontSize: '0.85rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                border: '1px solid #dbe3ef',
                                backgroundColor: '#fff'
                            }}
                        >
                            <span style={{ fontSize: '1rem', transform: isLoading ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s ease' }}>↻</span>
                            {isLoading ? '갱신 중...' : '공고 새로고침'}
                        </button>
                    </div>
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
                                {tab.label}({isLoading ? 0 : tabCounts[tab.id]})
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="job-empty-state" style={{ padding: '4rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div className="loading-spinner" style={{ width: '32px', height: '32px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>서버에서 채용 공고를 불러오는 중입니다...</p>
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : pagedJobs.length > 0 ? (
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
                                    <strong>{isMatching ? '계산 중...' : matchDetails ? `${matchDetails.matchScore}%` : '-'}</strong>
                                </div>
                                <div className="job-match-grid">
                                    <div className="job-match-item" style={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span>AI 매칭 분석 결과</span>
                                        </div>
                                        <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                            {isMatching ? '이력서와 공고를 비교 분석하고 있습니다...' : matchDetails ? matchDetails.reason : '매칭 점수를 불러오지 못했습니다.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="job-detail-body">
                            <h3>공고 상세 정보</h3>
                            <div className="job-detail-section-grid">
                                <article>
                                    <strong>주요 업무 및 설명</strong>
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedJob.description || '정보 없음'}</p>
                                </article>
                                <article>
                                    <strong>자격 요건</strong>
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedJob.requirements || '정보 없음'}</p>
                                </article>
                            </div>
                        </div>

                        <div className="job-detail-footer">
                            <Link to={`/cover-letters/new-draft?jobId=${selectedJob.id}`} className="primary-action-button" style={{ textDecoration: 'none', textAlign: 'center' }}>
                                AI 자소서 생성
                            </Link>
                            <button type="button" className="secondary-action-button" onClick={() => setSelectedJob(null)}>닫기</button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

export default JobPostingsPage;
