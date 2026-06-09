import { useMemo, useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredCoverLetters } from '../state/coverLetters';
import {
    formatRelativeDateFromDaysAgo,
    formatRelativeDateFromIso,
    getSeoulDaysAgoFromIso,
} from '../utils/date';
import './CoverLetters.css';

type CoverLetterSort = 'recent' | 'deadline';

function formatRelativeDate(daysAgo: number) {
    return formatRelativeDateFromDaysAgo(daysAgo);
}

function getCoverLetterDaysAgo(item: { updatedAtIso?: string; updatedAtDaysAgo: number }) {
    return item.updatedAtIso ? getSeoulDaysAgoFromIso(item.updatedAtIso) : item.updatedAtDaysAgo;
}

function formatCoverLetterUpdatedAt(item: { updatedAtIso?: string; updatedAtDaysAgo: number }) {
    return item.updatedAtIso ? formatRelativeDateFromIso(item.updatedAtIso) : formatRelativeDate(item.updatedAtDaysAgo);
}

function MyCoverLettersPage() {
    const [open, setOpen] = useState(false);
    const [sort, setSort] = useState<CoverLetterSort>('recent');
    const [coverLetterItems, setCoverLetterItems] = useState<CoverLetterDocument[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await fetch('/api/resume/list', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                if (response.ok) {
                    const json = await response.json();
                    const mapped: CoverLetterDocument[] = (json.data || []).map((r: any) => ({
                        id: r.jobId,
                        title: `${r.companyName} - ${r.jobTitle}`,
                        company: r.companyName,
                        role: r.jobTitle,
                        updatedAt: '최근 수정됨',
                        updatedAtIso: r.createdAt,
                        updatedAtDaysAgo: 0,
                        deadlineDaysLeft: 0,
                        status: '완료',
                        progress: 100,
                        content: r.generatedText,
                        originalContent: '',
                        feedback: [],
                        questions: []
                    }));
                    setCoverLetterItems(mapped);
                }
            } catch (error) {
                console.error('Fetch resumes error:', error);
            }
        };
        fetchResumes();
    }, []);

    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [draftFile, setDraftFile] = useState<File | null>(null);

    const handleTemplateChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setTemplateFile(e.target.files[0]);
    };

    const handleDraftChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setDraftFile(e.target.files[0]);
    };

    const sortedCoverLetters = useMemo(
        () =>
            [...coverLetterItems].sort((a, b) => {
                if (sort === 'deadline') {
                    return a.deadlineDaysLeft - b.deadlineDaysLeft;
                }

                return getCoverLetterDaysAgo(a) - getCoverLetterDaysAgo(b);
            }),
        [coverLetterItems, sort]
    );

    const createDraft = () => {
        setOpen(false);
        navigate('/cover-letters/new-draft');
    };

    return (
        <section className="cover-letters-page">
            <div className="cover-letters-header">
                <div>
                    <div className="page-breadcrumb-title">
                        <Link to="/home">‹ 메인으로</Link>
                        <span>/</span>
                        <h1>AI 자소서</h1>
                    </div>
                    <p>회사별 자소서 문서를 관리하고 AI 첨삭 결과를 이어서 확인하세요.</p>
                </div>
            </div>

            <div className="cover-letters-toolbar">
                <select
                    className="cover-letters-select"
                    aria-label="자소서 정렬"
                    value={sort}
                    onChange={(event) => setSort(event.target.value as CoverLetterSort)}
                >
                    <option value="recent">최근 수정순</option>
                    <option value="deadline">마감 임박순</option>
                </select>
            </div>

            <div className="cover-letters-grid">
                <button type="button" className="cover-letter-create-card" onClick={() => setOpen(true)}>
                    <span>+</span>
                    <strong>자소서 생성</strong>
                </button>
                {sortedCoverLetters.map((item) => (
                    <button key={item.id} type="button" className="cover-letter-list-card" onClick={() => navigate(`/cover-letters/${item.id}`)}>
                        <span className="cover-letter-card-date">{formatCoverLetterUpdatedAt(item)}</span>
                        <h3>{item.title}</h3>
                        <p>{item.company}</p>
                        <strong>{item.role}</strong>
                    </button>
                ))}
            </div>

            {open && (
                <div className="modal-backdrop" role="presentation">
                    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="create-cover-letter-title">
                        <div className="modal-header">
                            <div>
                                <h2 id="create-cover-letter-title">자소서 생성</h2>
                                <p>회사 자소서 양식과 기존 작성본을 첨부하면 자소서가 생성됩니다.</p>
                            </div>
                            <button type="button" className="modal-close-button" aria-label="닫기" onClick={() => setOpen(false)}>×</button>
                        </div>

                        <div className="form-grid">
                            <div className="form-field">
                                <span className="form-field-label">회사 자소서 양식</span>
                                <div className="upload-dropzone" onClick={() => document.getElementById('template-upload')?.click()} style={{ cursor: 'pointer' }}>
                                    <input type="file" id="template-upload" hidden onChange={handleTemplateChange} accept=".pdf,.doc,.docx" />
                                    <span className="upload-dropzone-message">
                                        {templateFile ? `✅ ${templateFile.name}` : '자소서 양식 파일을 드래그해서 첨부하거나 클릭하세요.'}
                                    </span>
                                    <button type="button" className="secondary-action-button">양식 파일 첨부</button>
                                </div>
                            </div>
                            <div className="form-field">
                                <span className="form-field-label">기존 작성 자소서</span>
                                <div className="upload-dropzone" onClick={() => document.getElementById('draft-upload')?.click()} style={{ cursor: 'pointer' }}>
                                    <input type="file" id="draft-upload" hidden onChange={handleDraftChange} accept=".pdf,.doc,.docx" />
                                    <span className="upload-dropzone-message">
                                        {draftFile ? `✅ ${draftFile.name}` : '기존 자소서 파일을 드래그해서 첨부하거나 클릭하세요.'}
                                    </span>
                                    <button type="button" className="secondary-action-button">작성본 첨부</button>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="secondary-action-button" onClick={() => {
                                setOpen(false);
                                setTemplateFile(null);
                                setDraftFile(null);
                            }}>취소</button>
                            <button type="button" className="primary-action-button" onClick={createDraft}>생성하기</button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

export default MyCoverLettersPage;
