import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, DragEvent, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CourseGrade } from '../types/career';
import './PortfolioPage.css';

const PORTFOLIO_SYNC_STORAGE_KEY = 'didim:portfolio-sync-state';
const PORTFOLIO_UPLOADS_STORAGE_KEY = 'didim:portfolio-uploads';
const INITIAL_VISIBLE_COUNT = 2;
const LOAD_MORE_COUNT = 5;

interface UploadedPortfolioFile {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
}

const getCurrentAcademicFilter = () => {
    const now = new Date();
    const month = now.getMonth() + 1;

    return {
        year: String(now.getFullYear()),
        semester: month >= 3 && month <= 8 ? '1' : '2',
    };
};

function getStoredUploadedFiles() {
    try {
        const rawValue = window.localStorage.getItem(PORTFOLIO_UPLOADS_STORAGE_KEY);

        if (!rawValue) {
            return [];
        }

        return JSON.parse(rawValue) as UploadedPortfolioFile[];
    } catch {
        return [];
    }
}

function formatFileSize(size: number) {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function PortfolioPage() {
    const { sectionId } = useParams();
    const [syncState, setSyncState] = useState(() =>
        window.localStorage.getItem(PORTFOLIO_SYNC_STORAGE_KEY) === 'done' ? 'done' : 'idle'
    );
    
    // 서버 데이터를 저장할 상태 추가
    const [portfolioData, setPortfolioData] = useState({
        gpa: null as number | null,
        grades: [] as CourseGrade[],
        awards: [] as any[],
        scholarships: [] as any[],
        certificates: [] as any[],
        activities: [] as any[],
        projects: [] as any[],
    });

    const isSynced = syncState === 'done';
    const currentAcademicFilter = useMemo(() => getCurrentAcademicFilter(), []);
    const [selectedYear, setSelectedYear] = useState(currentAcademicFilter.year);
    const [selectedSemester, setSelectedSemester] = useState(currentAcademicFilter.semester);
    const [appliedYear, setAppliedYear] = useState(currentAcademicFilter.year);
    const [appliedSemester, setAppliedSemester] = useState(currentAcademicFilter.semester);
    const [visibleCounts, setVisibleCounts] = useState({
        awards: INITIAL_VISIBLE_COUNT,
        certificates: INITIAL_VISIBLE_COUNT,
        activities: INITIAL_VISIBLE_COUNT,
        projects: INITIAL_VISIBLE_COUNT,
    });
    const [uploadedFiles, setUploadedFiles] = useState(getStoredUploadedFiles);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [isUploadDragging, setIsUploadDragging] = useState(false);
    const [isProjectEditing, setIsProjectEditing] = useState(false);
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const gradeYears = useMemo(
        () => Array.from(new Set([currentAcademicFilter.year, ...portfolioData.grades.map((item) => item.term.split('-')[0])])).sort((a, b) => Number(b) - Number(a)),
        [currentAcademicFilter.year, portfolioData.grades]
    );

    const filteredGrades = useMemo(
        () =>
            portfolioData.grades.filter((item) => {
                const [year, semester] = item.term.split('-');
                return appliedYear === year && appliedSemester === semester;
            }),
        [appliedSemester, appliedYear, portfolioData.grades]
    );

    const parsePortfolioData = (data: any) => {
        setPortfolioData({
            gpa: data.gpa || null,
            grades: data.grades || [],
            awards: data.awards || [],
            scholarships: data.scholarships || [],
            certificates: data.certifications || [],
            activities: data.volunteer || [],
            projects: data.projects || [],
        });
    };

    const handleRefresh = async () => {
        setSyncState('syncing');
        try {
            const response = await fetch('/api/portfolio/lms', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            if (response.ok) {
                const json = await response.json();
                if (json.data) parsePortfolioData(json.data);
                window.localStorage.setItem(PORTFOLIO_SYNC_STORAGE_KEY, 'done');
                setSyncState('done');
            } else {
                setSyncState('idle');
            }
        } catch (error) {
            setSyncState('idle');
            console.error('LMS sync error:', error);
        }
    };

    const handleGradeSearch = () => {
        setAppliedYear(selectedYear);
        setAppliedSemester(selectedSemester);
    };

    const showMore = (key: keyof typeof visibleCounts) => {
        setVisibleCounts((prev) => ({
            ...prev,
            [key]: prev[key] + LOAD_MORE_COUNT,
        }));
    };

    const visibleProjectItems = isSynced ? portfolioData.projects.slice(0, visibleCounts.projects) : [];
    const selectedVisibleProjectCount = visibleProjectItems.filter((project) => selectedProjectIds.includes(project.id || project.title)).length;
    const isAllVisibleProjectsSelected = visibleProjectItems.length > 0 && selectedVisibleProjectCount === visibleProjectItems.length;

    const closeProjectEditing = () => {
        setIsProjectEditing(false);
        setSelectedProjectIds([]);
    };

    const toggleProjectSelection = (projectId: string) => {
        setSelectedProjectIds((prev) =>
            prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
        );
    };

    const toggleAllVisibleProjects = () => {
        if (isAllVisibleProjectsSelected) {
            setSelectedProjectIds((prev) => prev.filter((id) => !visibleProjectItems.some((project) => (project.id || project.title) === id)));
            return;
        }

        setSelectedProjectIds((prev) => Array.from(new Set([...prev, ...visibleProjectItems.map((project) => project.id || project.title)])));
    };

    const confirmProjectDelete = async () => {
        // 서버와 동기화된 데이터를 직접 삭제하려면 PUT /api/portfolio 요청이 필요합니다.
        // 현재는 UI 상에서만 삭제 처리되도록 임시 구현합니다. (추후 백엔드 삭제 연동 필요)
        const updatedProjects = portfolioData.projects.filter((project) => !selectedProjectIds.includes(project.id || project.title));
        
        try {
            await fetch('/api/portfolio', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ ...portfolioData, projects: updatedProjects })
            });
            setPortfolioData(prev => ({ ...prev, projects: updatedProjects }));
        } catch (error) {
            console.error('Project delete error', error);
        }

        setDeleteModalOpen(false);
        closeProjectEditing();
    };

    const appendPendingFiles = (files: FileList | File[]) => {
        const nextFiles = Array.from(files);
        if (nextFiles.length === 0) return;

        setPendingFiles((prev) => {
            // 기존 파일과 새로 추가된 파일 합치기 (동일 파일명 제외)
            const existingNames = new Set(prev.map(f => f.name));
            const uniqueNewFiles = nextFiles.filter(f => !existingNames.has(f.name));
            return [...prev, ...uniqueNewFiles];
        });
    };

    const handleUploadInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            appendPendingFiles(files);
        }
        // 이 시점에서는 value를 초기화해도 이미 appendPendingFiles로 전달됨
        event.target.value = '';
    };

    const handleUploadDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsUploadDragging(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            appendPendingFiles(event.dataTransfer.files);
        }
    };

    const closeUploadModal = () => {
        setUploadModalOpen(false);
        setPendingFiles([]);
        setIsUploadDragging(false);
        setIsSaving(false);
    };

    const [isSaving, setIsSaving] = useState(false);

    const saveUploadedFiles = async () => {
        if (pendingFiles.length === 0) {
            alert('업로드할 파일을 먼저 선택해주세요.');
            return;
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            // 백엔드가 현재 단일 파일만 지원하므로 첫 번째 파일 전송
            formData.append('file', pendingFiles[0]);

            console.log('Sending upload request to /api/portfolio/upload...');
            const response = await fetch('/api/portfolio/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                alert('파일 분석이 완료되었습니다!');
                
                // 업로드 성공 후 리스트 갱신 (서버에서 받은 데이터가 있으면 반영)
                if (data.data) {
                    parsePortfolioData(data.data);
                    const uploadedAt = new Date().toISOString();
                    const newEntry: UploadedPortfolioFile = {
                        id: `file-${Date.now()}`,
                        name: pendingFiles[0].name,
                        size: pendingFiles[0].size,
                        type: pendingFiles[0].type || 'PDF',
                        uploadedAt,
                    };
                    setUploadedFiles(prev => [newEntry, ...prev]);
                }
                closeUploadModal();
            } else {
                const errorBody = await response.text();
                console.error('Upload failed:', errorBody);
                alert('파일 분석에 실패했습니다. 파일 형식을 확인해주세요.');
            }
        } catch (error) {
            console.error('File upload network error:', error);
            alert('서버와 통신할 수 없습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const response = await fetch('/api/portfolio', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.data) {
                        parsePortfolioData(data.data);
                        setSyncState('done');
                    }
                }
            } catch (error) {
                console.error('Fetch portfolio error:', error);
            }
        };
        fetchPortfolio();
    }, []);

    useEffect(() => {
        if (!sectionId) return;
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [sectionId]);

    useEffect(() => {
        window.localStorage.setItem(PORTFOLIO_UPLOADS_STORAGE_KEY, JSON.stringify(uploadedFiles));
    }, [uploadedFiles]);

    const renderMoreButton = (key: keyof typeof visibleCounts, total: number) => {
        const remaining = total - visibleCounts[key];

        if (!isSynced || remaining <= 0) return null;

        return (
            <div className="portfolio-more-row">
                <button type="button" className="portfolio-more-button" aria-label="더보기" onClick={() => showMore(key)}>
                    더보기 <span aria-hidden="true">⋯</span>
                </button>
            </div>
        );
    };

    return (
        <section className="portfolio-page">
            <div className="portfolio-breadcrumb-row">
                <Link to="/home">‹ 메인으로</Link>
                <span>/</span>
                <strong>포트폴리오</strong>
                <button type="button" className="secondary-action-button portfolio-upload-button" onClick={() => setUploadModalOpen(true)}>
                    업로드
                </button>
                <button type="button" className="primary-action-button portfolio-sync-button" onClick={handleRefresh} disabled={syncState === 'syncing'}>
                    Refresh
                </button>
            </div>

            <div className="portfolio-summary-card">
                <div className="portfolio-summary-stats">
                    <div className="portfolio-summary-item">
                        <span>전체 평점</span>
                        <strong>{isSynced && portfolioData.gpa ? portfolioData.gpa.toFixed(2) : '-'} <em>/ 4.5</em></strong>
                    </div>
                    <div className="portfolio-summary-item">
                        <span>전공 평점</span>
                        <strong>{isSynced && portfolioData.gpa ? portfolioData.gpa.toFixed(2) : '-'} <em>/ 4.5</em></strong>
                    </div>
                    <div className="portfolio-summary-item">
                        <span>수강 과목</span>
                        <strong>{isSynced ? portfolioData.grades.length : 0} <em>과목</em></strong>
                    </div>
                </div>
                <span className="portfolio-summary-sync">{isSynced ? 'LMS 자동 동기화됨 ›' : syncState === 'syncing' ? '동기화 중...' : 'LMS 연동 전'}</span>
            </div>

            {uploadedFiles.length > 0 && (
                <ListSection<UploadedPortfolioFile>
                    id="uploads"
                    title="업로드한 파일"
                    count={uploadedFiles.length}
                    items={uploadedFiles}
                    renderItem={(file) => (
                        <article className="portfolio-list-item portfolio-uploaded-file-item" key={file.id}>
                            <strong>{file.name}</strong>
                            <p>{file.type} · {formatFileSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString('ko-KR')}</p>
                            <p>백엔드 분류 기능이 연결되면 알맞은 포트폴리오 섹션에 자동 반영됩니다.</p>
                        </article>
                    )}
                    moreButton={null}
                />
            )}

            <section id="grades" className="portfolio-section-card">
                <div className="portfolio-section-head">
                    <div className="portfolio-section-title"><strong>학점</strong><span>{isSynced ? filteredGrades.length : 0}건</span></div>
                    {isSynced && (
                        <div className="portfolio-grade-controls">
                            <select aria-label="학년도 선택" value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                                {gradeYears.map((year) => <option key={year} value={year}>{year}년</option>)}
                            </select>
                            <select aria-label="학기 선택" value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)}>
                                <option value="1">1학기</option>
                                <option value="2">2학기</option>
                            </select>
                            <button type="button" className="secondary-action-button" onClick={handleGradeSearch}>조회</button>
                        </div>
                    )}
                </div>
                {isSynced && (
                    <>
                        <div className="portfolio-table-head">
                            <span>학기</span><span>과목명</span><span>학점</span><span>성적</span>
                        </div>
                        {filteredGrades.map((item) => (
                            <div className="portfolio-table-row" key={`${item.term}-${item.name}`}>
                                <span>{item.term}</span>
                                <strong>{item.name}</strong>
                                <span>{item.credit}</span>
                                <strong className={item.grade.includes('+') ? 'grade-emphasis' : ''}>{item.grade}</strong>
                            </div>
                        ))}
                        {filteredGrades.length === 0 && (
                            <div className="portfolio-empty-row">선택한 학기에 동기화된 과목과 성적이 없습니다.</div>
                        )}
                    </>
                )}
            </section>

            <ListSection<any>
                id="awards"
                title="수상 내역"
                count={isSynced ? portfolioData.awards.length : 0}
                items={isSynced ? portfolioData.awards.slice(0, visibleCounts.awards) : []}
                renderItem={(award) => (
                    <article className="portfolio-list-item" key={award.name || award.title}>
                        <strong>{award.name || award.title}</strong>
                        <p>{award.organization} · {award.year || award.date}</p>
                        <p>{award.description}</p>
                    </article>
                )}
                moreButton={renderMoreButton('awards', portfolioData.awards.length)}
            />

            <ListSection<any>
                id="certificates"
                title="자격증"
                count={isSynced ? portfolioData.certificates.length : 0}
                items={isSynced ? portfolioData.certificates.slice(0, visibleCounts.certificates) : []}
                renderItem={(certificate) => (
                    <article className="portfolio-list-item" key={certificate.credentialId || certificate.name || certificate.title}>
                        <strong>{certificate.name || certificate.title}</strong>
                        <p>{certificate.issuer} · {certificate.date}</p>
                        <p>{certificate.description}</p>
                    </article>
                )}
                moreButton={renderMoreButton('certificates', portfolioData.certificates.length)}
            />

            <ListSection<any>
                id="activities"
                title="활동 / 동아리 / 장학금"
                count={isSynced ? (portfolioData.activities.length + portfolioData.scholarships.length) : 0}
                items={isSynced ? [...portfolioData.activities, ...portfolioData.scholarships].slice(0, visibleCounts.activities) : []}
                renderItem={(activity) => (
                    <article className="portfolio-activity-item" key={activity.title || activity.org || activity.name}>
                        <div className="nav-icon small" />
                        <div className="portfolio-activity-copy">
                            <div className="portfolio-activity-top">
                                <strong>{activity.title || activity.org || activity.name}</strong>
                                {activity.role && <span className="portfolio-activity-role">{activity.role}</span>}
                            </div>
                            <span className="portfolio-activity-period">{activity.period || activity.semester || (activity.hours && `${activity.hours}시간`)}</span>
                            <p>{activity.description}</p>
                        </div>
                    </article>
                )}
                moreButton={renderMoreButton('activities', portfolioData.activities.length + portfolioData.scholarships.length)}
            />

            <ListSection<any>
                id="projects"
                title="프로젝트"
                count={isSynced ? portfolioData.projects.length : 0}
                items={visibleProjectItems}
                renderItem={(project) => (
                    <article className={`portfolio-project-item${isProjectEditing ? ' is-editing' : ''}`} key={project.id || project.title}>
                        {isProjectEditing && (
                            <label className="portfolio-project-check">
                                <input
                                    type="checkbox"
                                    checked={selectedProjectIds.includes(project.id || project.title)}
                                    onChange={() => toggleProjectSelection(project.id || project.title)}
                                    aria-label={`${project.title} 선택`}
                                />
                            </label>
                        )}
                        <div className="portfolio-project-icon nav-icon small" />
                        <div>
                            <strong>{project.title} {project.link && <span className="inline-link">{project.link}</span>}</strong>
                            <p>{project.period}</p>
                            <p>{project.stack}</p>
                            <p>{project.description}</p>
                        </div>
                    </article>
                )}
                moreButton={renderMoreButton('projects', portfolioData.projects.length)}
                headerActions={isSynced && (
                    <div className="portfolio-project-actions">
                        {isProjectEditing && (
                            <>
                                <label className="portfolio-select-all">
                                    <input
                                        type="checkbox"
                                        checked={isAllVisibleProjectsSelected}
                                        onChange={toggleAllVisibleProjects}
                                    />
                                    <span>전체선택</span>
                                </label>
                                <button
                                    type="button"
                                    className="secondary-action-button portfolio-delete-button"
                                    onClick={() => setDeleteModalOpen(true)}
                                    disabled={selectedProjectIds.length === 0}
                                >
                                    삭제
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            className="secondary-action-button portfolio-edit-toggle-button"
                            onClick={() => (isProjectEditing ? closeProjectEditing() : setIsProjectEditing(true))}
                            aria-label={isProjectEditing ? '프로젝트 편집 닫기' : '프로젝트 편집'}
                        >
                            {isProjectEditing ? '×' : '편집'}
                        </button>
                    </div>
                )}
            />

            {uploadModalOpen && (
                <div className="portfolio-modal-backdrop" role="presentation">
                    <section className="portfolio-modal-card portfolio-upload-modal" role="dialog" aria-modal="true" aria-labelledby="portfolio-upload-title">
                        <div className="portfolio-modal-header">
                            <div>
                                <h2 id="portfolio-upload-title">포트폴리오 파일 업로드</h2>
                                <p>파일을 드래그해서 첨부하거나 직접 선택하세요.</p>
                            </div>
                            <button type="button" className="portfolio-modal-close" aria-label="닫기" onClick={closeUploadModal}>×</button>
                        </div>

                        <label
                            className={`portfolio-upload-dropzone${isUploadDragging ? ' is-dragging' : ''}`}
                            onDragEnter={(event) => {
                                event.preventDefault();
                                setIsUploadDragging(true);
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDragLeave={() => setIsUploadDragging(false)}
                            onDrop={handleUploadDrop}
                        >
                            <input type="file" multiple onChange={handleUploadInputChange} />
                            <strong>파일을 여기에 놓으세요</strong>
                            <span>PDF, 이미지, 문서 파일을 첨부할 수 있습니다.</span>
                            <em>파일 선택</em>
                        </label>

                        {pendingFiles.length > 0 && (
                            <div className="portfolio-upload-file-list">
                                {pendingFiles.map((file) => (
                                    <div className="portfolio-upload-file-row" key={`${file.name}-${file.size}-${file.lastModified}`}>
                                        <strong>{file.name}</strong>
                                        <span>{formatFileSize(file.size)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="portfolio-modal-actions">
                            <button type="button" className="secondary-action-button" onClick={closeUploadModal} disabled={isSaving}>취소</button>
                            <button type="button" className="primary-action-button" onClick={saveUploadedFiles} disabled={pendingFiles.length === 0 || isSaving}>
                                {isSaving ? '분석 중...' : '저장'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {deleteModalOpen && (
                <div className="portfolio-modal-backdrop" role="presentation">
                    <section className="portfolio-modal-card" role="dialog" aria-modal="true" aria-labelledby="project-delete-title">
                        <h2 id="project-delete-title">삭제하시겠습니까?</h2>
                        <p>선택한 프로젝트 {selectedProjectIds.length}건이 리스트에서 삭제됩니다.</p>
                        <div className="portfolio-modal-actions">
                            <button type="button" className="secondary-action-button" onClick={() => setDeleteModalOpen(false)}>취소</button>
                            <button type="button" className="primary-action-button" onClick={confirmProjectDelete}>삭제</button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

interface ListSectionProps<T> {
    id: string;
    title: string;
    count: number;
    items: T[];
    renderItem: (item: T) => ReactNode;
    moreButton: ReactNode;
    headerActions?: ReactNode;
}

function ListSection<T>({ id, title, count, items, renderItem, moreButton, headerActions }: ListSectionProps<T>) {
    return (
        <section id={id} className="portfolio-section-card">
            <div className="portfolio-section-head">
                <div className="portfolio-section-title"><strong>{title}</strong><span>{count}건</span></div>
                {headerActions}
            </div>
            {items.length > 0 && <div className="portfolio-list">{items.map(renderItem)}</div>}
            {moreButton}
        </section>
    );
}

export default PortfolioPage;
