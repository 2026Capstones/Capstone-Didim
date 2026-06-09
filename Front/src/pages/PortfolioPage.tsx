import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, DragEvent, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { activities, awards, certificates, grades, projects } from '../mocks/career';
import type { PortfolioActivity, PortfolioAward, PortfolioCertificate, PortfolioProject } from '../types/career';
import './PortfolioPage.css';

const PORTFOLIO_SYNC_STORAGE_KEY = 'didim:portfolio-sync-state';
const PORTFOLIO_PROJECTS_STORAGE_KEY = 'didim:portfolio-projects';
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

function getStoredProjects() {
    try {
        const rawValue = window.localStorage.getItem(PORTFOLIO_PROJECTS_STORAGE_KEY);

        if (!rawValue) {
            return projects;
        }

        return JSON.parse(rawValue) as PortfolioProject[];
    } catch {
        return projects;
    }
}

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
    const [projectItems, setProjectItems] = useState(getStoredProjects);
    const [uploadedFiles, setUploadedFiles] = useState(getStoredUploadedFiles);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [isUploadDragging, setIsUploadDragging] = useState(false);
    const [isProjectEditing, setIsProjectEditing] = useState(false);
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const gradeYears = useMemo(
        () => Array.from(new Set([currentAcademicFilter.year, ...grades.map((item) => item.term.split('-')[0])])).sort((a, b) => Number(b) - Number(a)),
        [currentAcademicFilter.year]
    );

    const filteredGrades = useMemo(
        () =>
            grades.filter((item) => {
                const [year, semester] = item.term.split('-');
                return appliedYear === year && appliedSemester === semester;
            }),
        [appliedSemester, appliedYear]
    );

    const handleRefresh = () => {
        setSyncState('syncing');
        window.setTimeout(() => {
            window.localStorage.setItem(PORTFOLIO_SYNC_STORAGE_KEY, 'done');
            setSyncState('done');
        }, 700);
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

    const visibleProjectItems = isSynced ? projectItems.slice(0, visibleCounts.projects) : [];
    const selectedVisibleProjectCount = visibleProjectItems.filter((project) => selectedProjectIds.includes(project.id)).length;
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
            setSelectedProjectIds((prev) => prev.filter((id) => !visibleProjectItems.some((project) => project.id === id)));
            return;
        }

        setSelectedProjectIds((prev) => Array.from(new Set([...prev, ...visibleProjectItems.map((project) => project.id)])));
    };

    const confirmProjectDelete = () => {
        setProjectItems((prev) => prev.filter((project) => !selectedProjectIds.includes(project.id)));
        setDeleteModalOpen(false);
        closeProjectEditing();
    };

    const appendPendingFiles = (files: FileList | File[]) => {
        setPendingFiles((prev) => {
            const nextFiles = Array.from(files);
            const existingKeys = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
            const uniqueNextFiles = nextFiles.filter((file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`));

            return [...prev, ...uniqueNextFiles];
        });
    };

    const handleUploadInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            appendPendingFiles(event.target.files);
        }

        event.target.value = '';
    };

    const handleUploadDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsUploadDragging(false);
        appendPendingFiles(event.dataTransfer.files);
    };

    const closeUploadModal = () => {
        setUploadModalOpen(false);
        setPendingFiles([]);
        setIsUploadDragging(false);
    };

    const saveUploadedFiles = () => {
        const uploadedAt = new Date().toISOString();
        const nextUploadedFiles = pendingFiles.map((file) => ({
            id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
            name: file.name,
            size: file.size,
            type: file.type || '파일',
            uploadedAt,
        }));

        setUploadedFiles((prev) => [...nextUploadedFiles, ...prev]);
        closeUploadModal();
    };

    useEffect(() => {
        if (!sectionId) return;
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [sectionId]);

    useEffect(() => {
        window.localStorage.setItem(PORTFOLIO_PROJECTS_STORAGE_KEY, JSON.stringify(projectItems));
    }, [projectItems]);

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
                        <strong>{isSynced ? '3.9' : '-'} <em>/ 4.5</em></strong>
                    </div>
                    <div className="portfolio-summary-item">
                        <span>전공 평점</span>
                        <strong>{isSynced ? '4.1' : '-'} <em>/ 4.5</em></strong>
                    </div>
                    <div className="portfolio-summary-item">
                        <span>수강 과목</span>
                        <strong>{isSynced ? grades.length : 0} <em>과목</em></strong>
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

            <ListSection<PortfolioAward>
                id="awards"
                title="수상 내역"
                count={isSynced ? awards.length : 0}
                items={isSynced ? awards.slice(0, visibleCounts.awards) : []}
                renderItem={(award) => (
                    <article className="portfolio-list-item" key={award.title}>
                        <strong>{award.title}</strong>
                        <p>{award.organization} · {award.date}</p>
                        <p>{award.description}</p>
                    </article>
                )}
                moreButton={renderMoreButton('awards', awards.length)}
            />

            <ListSection<PortfolioCertificate>
                id="certificates"
                title="자격증"
                count={isSynced ? certificates.length : 0}
                items={isSynced ? certificates.slice(0, visibleCounts.certificates) : []}
                renderItem={(certificate) => (
                    <article className="portfolio-list-item" key={certificate.credentialId}>
                        <strong>{certificate.title}</strong>
                        <p>{certificate.issuer} · {certificate.date} · {certificate.credentialId}</p>
                        <p>{certificate.description}</p>
                    </article>
                )}
                moreButton={renderMoreButton('certificates', certificates.length)}
            />

            <ListSection<PortfolioActivity>
                id="activities"
                title="활동 / 동아리"
                count={isSynced ? activities.length : 0}
                items={isSynced ? activities.slice(0, visibleCounts.activities) : []}
                renderItem={(activity) => (
                    <article className="portfolio-activity-item" key={activity.title}>
                        <div className="nav-icon small" />
                        <div className="portfolio-activity-copy">
                            <div className="portfolio-activity-top">
                                <strong>{activity.title}</strong>
                                <span className="portfolio-activity-role">{activity.role}</span>
                            </div>
                            <span className="portfolio-activity-period">{activity.period}</span>
                            <p>{activity.description}</p>
                        </div>
                    </article>
                )}
                moreButton={renderMoreButton('activities', activities.length)}
            />

            <ListSection<PortfolioProject>
                id="projects"
                title="프로젝트"
                count={isSynced ? projectItems.length : 0}
                items={visibleProjectItems}
                renderItem={(project) => (
                    <article className={`portfolio-project-item${isProjectEditing ? ' is-editing' : ''}`} key={project.id}>
                        {isProjectEditing && (
                            <label className="portfolio-project-check">
                                <input
                                    type="checkbox"
                                    checked={selectedProjectIds.includes(project.id)}
                                    onChange={() => toggleProjectSelection(project.id)}
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
                moreButton={renderMoreButton('projects', projectItems.length)}
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
                            <button type="button" className="secondary-action-button" onClick={closeUploadModal}>취소</button>
                            <button type="button" className="primary-action-button" onClick={saveUploadedFiles} disabled={pendingFiles.length === 0}>저장</button>
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
