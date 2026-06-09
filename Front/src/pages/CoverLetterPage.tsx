import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { coverLetters } from '../mocks/career';
import { getStoredCoverLetterById, updateStoredCoverLetterContent, updateStoredCoverLetterTitle } from '../state/coverLetters';
import './CoverLetters.css';

function buildEditableDraft(
    questions: Array<{ title: string; answer: string }>,
    fallbackContent: string,
    isNewDraft: boolean,
) {
    if (isNewDraft) {
        return '회사 양식과 기존 작성본을 바탕으로 생성된 초안입니다.\n\n지원 동기와 직무 역량을 구체적인 프로젝트 경험으로 보강해 주세요.';
    }

    if (questions.length === 0) {
        return fallbackContent;
    }

    return questions
        .map((question) => `${question.title}\n\n${question.answer}`)
        .join('\n\n\n');
}

function getDownloadFileName(title: string) {
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').trim();
    return `${safeTitle || 'cover-letter'}.txt`;
}

async function downloadTextFile(fileName: string, content: string) {
    const pickerWindow = window as Window & {
        showSaveFilePicker?: (options: {
            suggestedName: string;
            types: Array<{
                description: string;
                accept: Record<string, string[]>;
            }>;
        }) => Promise<{
            createWritable: () => Promise<{
                write: (data: Blob) => Promise<void>;
                close: () => Promise<void>;
            }>;
        }>;
    };
    const textBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });

    if (pickerWindow.showSaveFilePicker) {
        const fileHandle = await pickerWindow.showSaveFilePicker({
            suggestedName: fileName,
            types: [
                {
                    description: 'Text file',
                    accept: { 'text/plain': ['.txt'] },
                },
            ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(textBlob);
        await writable.close();
        return;
    }

    const downloadUrl = URL.createObjectURL(textBlob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
}

function CoverLetterPage() {
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const { id } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const jobIdFromQuery = queryParams.get('jobId');

    // 실제 백엔드에서 받아올 데이터 상태
    const [document, setDocument] = useState<Partial<CoverLetterDocument>>({
        company: '불러오는 중...',
        role: '',
        feedback: [],
    });

    const isNewDraft = id === 'new-draft';
    const [coverLetterTitle, setCoverLetterTitle] = useState(isNewDraft ? '새 자소서 초안' : '');
    const [draftContent, setDraftContent] = useState(isNewDraft ? 'AI가 자소서를 작성하고 있습니다...' : '자소서를 불러오는 중입니다...');
    const [saveStatus, setSaveStatus] = useState('');

    // 기존 자소서 조회 또는 새 자소서 생성
    useEffect(() => {
        const fetchResume = async (jobId: string) => {
            try {
                const response = await fetch(`/api/resume/${jobId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                if (response.ok) {
                    const json = await response.json();
                    const data = json.data;
                    setDocument({
                        company: data.companyName,
                        role: data.jobTitle,
                        feedback: [], // 백엔드에서 피드백을 주지 않는다면 빈 배열
                    });
                    setCoverLetterTitle(`${data.companyName} - ${data.jobTitle}`);
                    setDraftContent(data.generatedText);
                } else if (isNewDraft) {
                    // 새 초안 생성 시도
                    generateResume(jobId);
                }
            } catch (error) {
                console.error('Fetch resume error:', error);
            }
        };

        const generateResume = async (jobId: string) => {
            try {
                const response = await fetch(`/api/resume/generate/${jobId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                if (response.ok) {
                    const json = await response.json();
                    const data = json.data;
                    setDocument({
                        company: data.companyName,
                        role: data.jobTitle,
                        feedback: [],
                    });
                    setCoverLetterTitle(`${data.companyName} - ${data.jobTitle}`);
                    setDraftContent(data.generatedText);
                } else {
                    setDraftContent('자소서 생성에 실패했습니다.');
                }
            } catch (error) {
                console.error('Generate resume error:', error);
                setDraftContent('서버 연결 중 오류가 발생했습니다.');
            }
        };

        if (isNewDraft && jobIdFromQuery) {
            generateResume(jobIdFromQuery);
        } else if (id && id !== 'new-draft') {
            fetchResume(id);
        }
    }, [id, isNewDraft, jobIdFromQuery]);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const trimmedTitle = coverLetterTitle.trim();
    const displayTitle = trimmedTitle || (isNewDraft ? '새 자소서 초안' : document.title || '제목 없음');

    const finishTitleEdit = () => {
        setCoverLetterTitle(displayTitle);
        setIsEditingTitle(false);
    };

    const handleSave = async () => {
        const targetJobId = isNewDraft ? jobIdFromQuery : id;
        if (!targetJobId) return;

        try {
            setSaveStatus('저장 중...');
            const response = await fetch(`/api/resume/${targetJobId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ generatedText: draftContent }),
            });

            if (response.ok) {
                setSaveStatus('저장되었습니다.');
            } else {
                setSaveStatus('저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Save resume error:', error);
            setSaveStatus('서버 연결 오류');
        }
    };

    const handleDownload = async () => {
        try {
            await downloadTextFile(getDownloadFileName(displayTitle), draftContent);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }

            throw error;
        }
    };

    return (
        <section className="cover-letter-detail-page">
            <div className="cover-letter-detail-header">
                <div className="cover-letter-detail-meta">
                    <div className="page-breadcrumb-title">
                        <Link to="/home">‹ 메인으로</Link>
                        <span>/</span>
                        <h1>AI 자소서</h1>
                    </div>
                    <Link to="/cover-letters" className="cover-letter-breadcrumb">‹ 자소서 목록</Link>
                    <div className="editable-title-row">
                        {isEditingTitle ? (
                            <input
                                className="editable-title-input"
                                value={coverLetterTitle}
                                onChange={(event) => setCoverLetterTitle(event.target.value)}
                                onBlur={finishTitleEdit}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        finishTitleEdit();
                                    }

                                    if (event.key === 'Escape') {
                                        setCoverLetterTitle(displayTitle);
                                        setIsEditingTitle(false);
                                    }
                                }}
                                autoFocus
                                aria-label="자소서 제목 수정"
                            />
                        ) : (
                            <h1>{displayTitle}</h1>
                        )}
                        <button
                            type="button"
                            className="title-edit-button"
                            aria-label="자소서 제목 수정"
                            onClick={() => setIsEditingTitle(true)}
                        >
                            <span aria-hidden="true">✎</span>
                        </button>
                    </div>
                    <p>{document.company} · {document.role}</p>
                </div>
                <div className="cover-letter-detail-actions">
                    {saveStatus && <span className="cover-letter-save-status">{saveStatus}</span>}
                    <button type="button" className="secondary-action-button" onClick={handleSave}>저장</button>
                    <button type="button" className="secondary-action-button" onClick={handleDownload}>다운로드</button>
                    <button type="button" className="primary-action-button">교수님 첨삭 요청</button>
                </div>
            </div>

            <div className="cover-letter-detail-grid">
                <aside className="detail-side-card">
                    <h2 className="detail-section-title">문서 정보</h2>
                    <div className="detail-meta-list">
                        <div><span>회사</span><strong>{document.company}</strong></div>
                        <div><span>직무</span><strong>{document.role}</strong></div>
                    </div>
                </aside>

                <main className="detail-editor-card">
                    <div className="detail-editor-action-row">
                        <button type="button" className="ghost-action-button" onClick={() => setReviewModalOpen(true)}>AI 재첨삭</button>
                    </div>
                    <textarea
                        className="detail-document-area"
                        aria-label="자소서 전체 수정 영역"
                        value={draftContent}
                        onChange={(event) => {
                            setDraftContent(event.target.value);
                            setSaveStatus('');
                        }}
                    />
                </main>

                <aside className="detail-feedback-card">
                    <h2 className="detail-section-title">AI 피드백</h2>
                    <div className="feedback-list">
                        <article className="feedback-card">
                            <strong>총평</strong>
                            <p>직무 경험은 잘 드러나지만 성과 수치와 회사 연결성이 더 필요합니다.</p>
                        </article>
                        <article className="feedback-card">
                            <strong>수정 제안</strong>
                            <ul>
                                {document.feedback.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                        </article>
                    </div>
                </aside>
            </div>

            {reviewModalOpen && (
                <div className="modal-backdrop" role="presentation">
                    <section className="modal-card ai-review-modal" role="dialog" aria-modal="true" aria-labelledby="ai-review-title">
                        <div className="modal-header">
                            <div>
                                <h2 id="ai-review-title">어떤 식으로 수정할까요?</h2>
                            </div>
                            <button type="button" className="modal-close-button" aria-label="닫기" onClick={() => setReviewModalOpen(false)}>×</button>
                        </div>

                        <div className="ai-review-input-row">
                            <input
                                type="text"
                                aria-label="AI 재첨삭 요청"
                                placeholder="AI에게 다시 요청할 내용을 자연스럽게 입력하세요."
                            />
                            <button type="button" className="primary-action-button" onClick={() => setReviewModalOpen(false)}>
                                재첨삭하기
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

export default CoverLetterPage;
