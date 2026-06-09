import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
    const document = (id && getStoredCoverLetterById(id)) || coverLetters[0];
    const isNewDraft = id === 'new-draft';
    const editableDraft = buildEditableDraft(document.questions, document.content, isNewDraft);
    const [coverLetterTitle, setCoverLetterTitle] = useState(isNewDraft ? '새 자소서 초안' : document.title);
    const [draftContent, setDraftContent] = useState(editableDraft);
    const [saveStatus, setSaveStatus] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const trimmedTitle = coverLetterTitle.trim();
    const displayTitle = trimmedTitle || (isNewDraft ? '새 자소서 초안' : document.title);

    const finishTitleEdit = () => {
        setCoverLetterTitle(displayTitle);
        if (!isNewDraft && id) {
            updateStoredCoverLetterTitle(id, displayTitle);
        }
        setIsEditingTitle(false);
    };

    const handleSave = () => {
        if (id) {
            updateStoredCoverLetterContent(id, draftContent, {
                ...document,
                title: displayTitle,
            });
            updateStoredCoverLetterTitle(id, displayTitle);
        }

        setSaveStatus('저장되었습니다.');
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
