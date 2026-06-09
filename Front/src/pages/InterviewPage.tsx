import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { interviews } from '../mocks/career';
import type { JobPosting } from '../types/career';
import { formatDdayFromDaysLeft, getDaysFromDdayText } from '../utils/date';
import './CoverLetters.css';

const INTERVIEW_ANSWER_ENDPOINT = '/api/interview/answer';

const interviewFeedbacks = [
    {
        id: 'kakao-backend',
        title: '카카오 백엔드 개발자 2회차',
        company: '카카오',
        role: '백엔드 개발자',
        date: '2026.06.04',
        summary: '대규모 트래픽 처리 경험을 중심으로 답변했지만 성과 수치가 부족했습니다.',
        goodTitle: '직무 경험 연결이 명확합니다',
        goodPoints: [
            '프로젝트 경험을 백엔드 개발 직무와 자연스럽게 연결했습니다.',
            '문제 상황, 본인 역할, 해결 방향의 흐름이 비교적 안정적입니다.',
            '협업 과정에서의 의사결정 근거를 함께 설명한 점이 좋습니다.',
        ],
        badTitle: '성과와 근거가 더 구체적이어야 합니다',
        badPoints: [
            '개선 결과를 수치나 사용자 반응으로 보여주면 설득력이 커집니다.',
            '기술 선택 이유가 짧아 면접관의 추가 질문 가능성이 높습니다.',
            '답변 마지막 문장이 약해 핵심 메시지가 흐려집니다.',
        ],
        nextPractice: '성과 수치, 기술 선택 근거, 마지막 한 문장 요약을 포함해 같은 질문에 다시 답변해보세요.',
        repeatedPoints: [
            { label: '성과와 근거 부족', count: 3 },
            { label: '기술 선택 이유 설명 부족', count: 2 },
        ],
    },
    {
        id: 'naver-cloud-intern',
        title: '네이버클라우드 인턴 1회차',
        company: '네이버클라우드',
        role: '플랫폼 개발 인턴',
        date: '2026.05.29',
        summary: '학습 속도와 협업 태도는 좋았지만 기술 깊이에 대한 설명이 약했습니다.',
        goodTitle: '성장 가능성과 협업 태도가 잘 보입니다',
        goodPoints: [
            '모르는 기술을 빠르게 학습해 적용한 과정을 구체적으로 설명했습니다.',
            '팀원과 역할을 나누고 결과를 맞춰간 경험이 잘 드러났습니다.',
            '인턴 직무에서 기대하는 태도와 학습 의지를 안정적으로 전달했습니다.',
        ],
        badTitle: '기술 깊이에 대한 후속 답변이 부족합니다',
        badPoints: [
            '사용한 기술의 내부 동작 원리를 설명하는 부분이 짧았습니다.',
            '장애 상황에서 어떤 로그를 확인했는지 구체성이 부족했습니다.',
            '본인의 기여도와 팀의 성과가 일부 섞여 보입니다.',
        ],
        nextPractice: '사용 기술의 동작 원리, 확인한 로그, 본인 기여 범위를 구분해서 다시 답변해보세요.',
        repeatedPoints: [
            { label: '기술 깊이 설명 부족', count: 2 },
            { label: '본인 기여도 구분 부족', count: 2 },
        ],
    },
    {
        id: 'samsung-dx',
        title: '삼성전자 DX부문 1회차',
        company: '삼성전자',
        role: '소프트웨어 엔지니어',
        date: '2026.05.21',
        summary: '문제 해결 과정은 좋았지만 회사와 직무 연결성이 더 필요했습니다.',
        goodTitle: '문제 해결 과정이 논리적입니다',
        goodPoints: [
            '문제를 작게 나누고 원인을 좁혀간 설명 흐름이 좋습니다.',
            '실패 원인과 다음 시도를 함께 말해 개선 태도가 드러납니다.',
            '개발 과정에서 품질을 고려한 점이 긍정적으로 보입니다.',
        ],
        badTitle: '회사와 직무 연결성이 약합니다',
        badPoints: [
            '왜 삼성전자 DX부문인지 답변의 차별점이 부족했습니다.',
            '지원 직무에서 본인의 경험이 어떻게 쓰일지 더 직접적으로 말해야 합니다.',
            '마무리 답변이 일반적이라 기억에 남는 메시지가 약합니다.',
        ],
        nextPractice: '회사 사업 영역, 직무 요구 역량, 본인 프로젝트 경험을 한 문장씩 연결해 답변해보세요.',
        repeatedPoints: [
            { label: '회사 지원동기 구체성 부족', count: 3 },
            { label: '마무리 메시지 약함', count: 2 },
        ],
    },
];

function getSupportedMimeType(candidates: string[]) {
    return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || '';
}

function stopRecorder(recorder: MediaRecorder | null, chunks: Blob[]) {
    return new Promise<Blob>((resolve) => {
        if (!recorder) {
            resolve(new Blob());
            return;
        }

        recorder.onstop = () => {
            resolve(new Blob(chunks, { type: recorder.mimeType || 'application/octet-stream' }));
        };

        if (recorder.state === 'inactive') {
            resolve(new Blob(chunks, { type: recorder.mimeType || 'application/octet-stream' }));
            return;
        }

        recorder.stop();
    });
}

function InterviewPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
    const [jobPickerOpen, setJobPickerOpen] = useState(false);
    const [savedJobs, setSavedJobs] = useState<JobPosting[]>([]);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [interviewType, setInterviewType] = useState('technical');
    
    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/interview/list', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const json = await response.json();
                const data = json.data || [];
                setHistory(data);
                if (data.length > 0 && !selectedFeedbackId) {
                    setSelectedFeedbackId(data[0].interviewId);
                }
            }
        } catch (error) {
            console.error('Fetch interview history error:', error);
        }
    };

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await fetch('/api/job-postings', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
                            match: 0,
                            tags: [],
                            saved: false,
                        }));
                        setSavedJobs(mappedJobs);
                        if (mappedJobs.length > 0) setSelectedJob(mappedJobs[0]);
                    }
                }
            } catch (error) {
                console.error('Fetch jobs error:', error);
            }
        };
        fetchJobs();
        fetchHistory();
    }, []);

    const [currentInterviewId, setCurrentInterviewId] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [expectedMinutes, setExpectedMinutes] = useState('20');
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'requesting' | 'recording' | 'submitting' | 'submitted' | 'error'>('idle');
    const [recordingMessage, setRecordingMessage] = useState('');
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const audioRecorderRef = useRef<MediaRecorder | null>(null);
    const videoRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const videoChunksRef = useRef<Blob[]>([]);

    // 선택된 피드백 데이터 매핑
    const selectedRecord = history.find(h => h.interviewId === selectedFeedbackId);
    const selectedFeedback = {
        company: selectedRecord?.companyName || '회사 정보 없음',
        role: selectedRecord?.jobTitle || '직무 정보 없음',
        date: selectedRecord?.createdAt ? new Date(selectedRecord.createdAt).toLocaleDateString() : '-',
        summary: selectedRecord?.overallFeedback || '아직 평가가 완료되지 않았거나 답변이 없습니다.',
        goodTitle: '강점 분석',
        goodPoints: selectedRecord?.qaList?.filter((qa: any) => (qa.score || 0) >= 70).map((qa: any) => qa.feedback).filter(Boolean).slice(0, 3) || ['충분한 답변 데이터가 없습니다.'],
        badTitle: '보완점 분석',
        badPoints: selectedRecord?.qaList?.filter((qa: any) => (qa.score || 0) < 70).map((qa: any) => qa.feedback).filter(Boolean).slice(0, 3) || ['보완할 점을 분석 중입니다.'],
        nextPractice: '전체적인 답변의 구체성을 높이고, 실무 경험을 수치화하여 답변하는 연습을 추천합니다.',
        repeatedPoints: [
            { label: '기술 용어 사용', count: 2 },
            { label: '답변 길이 적절성', count: 1 },
        ],
    };

    const recentSimulations = history.map((record) => ({
        id: record.interviewId,
        title: `${record.companyName} - ${record.jobTitle}`,
        date: new Date(record.createdAt).toLocaleDateString(),
        summary: record.overallFeedback,
        fallbackSummary: '상세 피드백을 확인하세요.'
    }));

    useEffect(() => {
        if (!jobPickerOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [jobPickerOpen]);

    useEffect(() => {
        if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = mediaStream;
        }
    }, [mediaStream]);

    useEffect(() => {
        return () => {
            mediaStream?.getTracks().forEach((track) => track.stop());
        };
    }, [mediaStream]);

    const startInterviewRecording = async () => {
        if (!selectedJob) {
            return;
        }

        try {
            setRecordingStatus('requesting');
            setRecordingMessage('면접 세션을 생성하는 중입니다...');

            // 1. 백엔드에서 면접 세션 시작 및 첫 질문 받기
            const startResponse = await fetch(`/api/interview/start/${selectedJob.id}?type=${interviewType}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (!startResponse.ok) {
                throw new Error('Failed to start interview session');
            }

            const startData = await startResponse.json();
            const interviewId = startData.data.interviewId;
            const firstQuestion = startData.data.qaList[0].question;
            
            setCurrentInterviewId(interviewId);
            setCurrentQuestion(firstQuestion);

            setRecordingMessage('카메라와 마이크 권한을 요청하는 중입니다.');

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });

            // 오디오와 비디오 트랙을 분리하여 각각의 레코더에 할당 (NotSupportedError 방지)
            const audioStream = new MediaStream(stream.getAudioTracks());
            const videoStream = new MediaStream(stream.getVideoTracks());

            const audioMimeType = getSupportedMimeType(['audio/webm;codecs=opus', 'audio/webm']);
            const videoMimeType = getSupportedMimeType(['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']);

            const audioRecorder = new MediaRecorder(audioStream, audioMimeType ? { mimeType: audioMimeType } : undefined);
            const videoRecorder = new MediaRecorder(videoStream, videoMimeType ? { mimeType: videoMimeType } : undefined);

            audioChunksRef.current = [];
            videoChunksRef.current = [];
            audioRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            videoRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    videoChunksRef.current.push(event.data);
                }
            };

            audioRecorderRef.current = audioRecorder;
            videoRecorderRef.current = videoRecorder;
            setMediaStream(stream);
            audioRecorder.start();
            videoRecorder.start();
            setRecordingStatus('recording');
            setRecordingMessage('면접 답변을 녹음/녹화하고 있습니다.');
        } catch (error: any) {
            console.error('Interview start process failed:', error);
            setRecordingStatus('error');
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                setRecordingMessage('카메라 또는 마이크 권한이 거부되었습니다. 브라우저 주소창 옆의 자물쇠 아이콘을 클릭해 권한을 허용해주세요.');
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                setRecordingMessage('연결된 마이크 또는 카메라를 찾을 수 없습니다. 장치 연결 상태를 확인해주세요.');
            } else if (error.message === 'Failed to start interview session') {
                setRecordingMessage('백엔드 면접 세션 생성에 실패했습니다. 서버 로그를 확인해주세요.');
            } else {
                setRecordingMessage(`오류 발생: ${error.name || 'UnknownError'}. 상세 내용은 콘솔 로그를 확인해주세요.`);
            }
        }
    };

    const finishInterviewRecording = async () => {
        if (!selectedJob || !currentInterviewId) {
            return;
        }

        try {
            setRecordingStatus('submitting');
            setRecordingMessage('답변 파일을 제출하는 중입니다.');

            const [audioBlob, videoBlob] = await Promise.all([
                stopRecorder(audioRecorderRef.current, audioChunksRef.current),
                stopRecorder(videoRecorderRef.current, videoChunksRef.current),
            ]);
            const formData = new FormData();

            formData.append('audioFile', new File([audioBlob], 'interview-answer-audio.webm', { type: audioBlob.type || 'audio/webm' }));
            formData.append('videoFile', new File([videoBlob], 'interview-answer-video.webm', { type: videoBlob.type || 'video/webm' }));
            
            const response = await fetch(`${INTERVIEW_ANSWER_ENDPOINT}/${currentInterviewId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Interview answer upload failed.');
            }

            const resultData = await response.json();
            const nextInterviewData = resultData.data;
            
            // 다음 질문 설정 (qaList의 마지막 항목이 보통 다음 질문임)
            const nextQa = nextInterviewData.qaList[nextInterviewData.qaList.length - 1];
            if (nextQa && !nextQa.answer) {
                setCurrentQuestion(nextQa.question);
            } else {
                setCurrentQuestion("면접이 종료되었습니다. 피드백을 확인하세요.");
            }

            mediaStream?.getTracks().forEach((track) => track.stop());
            setMediaStream(null);
            audioRecorderRef.current = null;
            videoRecorderRef.current = null;
            setRecordingStatus('submitted');
            setRecordingMessage('답변 파일을 제출했습니다.');
        } catch {
            setRecordingStatus('error');
            setRecordingMessage('답변 제출 중 오류가 발생했습니다. 백엔드 연결 상태를 확인해주세요.');
        }
    };

    return (
        <section className="simple-page interview-page">
            <div className="simple-page-header">
                <div className="page-breadcrumb-title">
                    <Link to="/home">‹ 메인으로</Link>
                    <span>/</span>
                    <h1>AI 면접</h1>
                </div>
                <p>시뮬레이션 종료 후 답변의 강점과 보완점을 확인하고 다음 연습 방향을 잡아보세요.</p>
            </div>

            <div className="interview-grid">
                <section className="interview-setup-card">
                    <div className="section-heading compact">
                        <h2>{currentQuestion ? 'AI 면접관의 질문' : '시뮬레이션 설정'}</h2>
                    </div>
                    {currentQuestion && (
                        <div className="interview-question-bubble">
                            <p style={{ padding: '1rem', backgroundColor: '#f0f4ff', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold' }}>
                                {currentQuestion}
                            </p>
                        </div>
                    )}
                    <div className="interview-selected-job">
                        <span>선택한 공고</span>
                        {selectedJob ? (
                            <div>
                                <strong>{selectedJob.company}</strong>
                                <p>{selectedJob.title}</p>
                                <small>{selectedJob.location} · {formatDdayFromDaysLeft(getDaysFromDdayText(selectedJob.deadline))}</small>
                            </div>
                        ) : (
                            <p>선택된 관심 공고가 없습니다.</p>
                        )}
                        <button type="button" className="secondary-action-button" onClick={() => setJobPickerOpen(true)}>
                            공고 선택하기
                        </button>
                    </div>
                    <div className="interview-form-grid">
                        <label>
                            <span>면접 유형</span>
                            <select value={interviewType} onChange={(event) => setInterviewType(event.target.value)}>
                                <option value="technical">기술</option>
                                <option value="personality">인성</option>
                                <option value="pt">직무</option>
                            </select>
                        </label>
                        <label>
                            <span>예상 시간</span>
                            <select value={expectedMinutes} onChange={(event) => setExpectedMinutes(event.target.value)}>
                                <option value="10">10분</option>
                                <option value="20">20분</option>
                                <option value="30">30분</option>
                            </select>
                        </label>
                    </div>
                    {mediaStream && (
                        <div className="interview-camera-panel">
                            <video ref={videoPreviewRef} autoPlay playsInline muted />
                        </div>
                    )}
                    {recordingMessage && <p className={`interview-recording-status status-${recordingStatus}`}>{recordingMessage}</p>}
                    <div className="interview-controls">
                        <button
                            type="button"
                            className="primary-action-button"
                            disabled={!selectedJob || recordingStatus === 'requesting' || recordingStatus === 'recording' || recordingStatus === 'submitting'}
                            onClick={startInterviewRecording}
                        >
                            면접 시작
                        </button>
                        {(recordingStatus === 'recording' || recordingStatus === 'submitting') && (
                            <button
                                type="button"
                                className="secondary-action-button"
                                disabled={recordingStatus === 'submitting'}
                                onClick={finishInterviewRecording}
                            >
                                답변 종료 및 제출
                            </button>
                        )}
                    </div>
                </section>

                <section className="interview-feedback-card">
                    <div className="interview-feedback-summary">
                        <div>
                            <span className="feedback-kicker">종료 후 피드백</span>
                            <h2>면접 답변 평가</h2>
                            <p>{selectedFeedback.company} · {selectedFeedback.role} · {selectedFeedback.date}</p>
                        </div>
                    </div>

                    <div className="interview-feedback-grid">
                        <article className="feedback-evaluation-card good">
                            <span>Good Point</span>
                            <h3>{selectedFeedback.goodTitle}</h3>
                            <ul>
                                {selectedFeedback.goodPoints.map((point) => <li key={point}>{point}</li>)}
                            </ul>
                        </article>
                        <article className="feedback-evaluation-card bad">
                            <span>Bad Point</span>
                            <h3>{selectedFeedback.badTitle}</h3>
                            <ul>
                                {selectedFeedback.badPoints.map((point) => <li key={point}>{point}</li>)}
                            </ul>
                        </article>
                    </div>

                    <div className="feedback-action-card">
                        <strong>다음 연습 포인트</strong>
                        <p>{selectedFeedback.nextPractice}</p>
                    </div>

                    <div className="repeated-feedback-card">
                        <h3>자주 지적 받은 point</h3>
                        <ul>
                            {selectedFeedback.repeatedPoints.map((point) => (
                                <li key={point.label}>
                                    <span>{point.label}</span>
                                    <strong>{point.count}회</strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="interview-history-card">
                    <h2>최근 시뮬레이션</h2>
                    {recentSimulations.map((record) => (
                        <article key={record.id} className={record.id === selectedFeedbackId ? 'is-selected' : undefined}>
                            <div className="interview-history-row">
                                <div>
                                    <strong>{record.title}</strong>
                                    <span>{record.date}</span>
                                </div>
                                <button
                                    type="button"
                                    className="secondary-action-button"
                                    onClick={() => setSelectedFeedbackId(record.id)}
                                >
                                    보기
                                </button>
                            </div>
                            <p>{record.summary || record.fallbackSummary}</p>
                        </article>
                    ))}
                </section>
            </div>

            {jobPickerOpen && (
                <div className="modal-backdrop" role="presentation">
                    <section className="modal-card interview-job-modal" role="dialog" aria-modal="true" aria-labelledby="interview-job-picker-title">
                        <div className="modal-header">
                            <div>
                                <h2 id="interview-job-picker-title">관심 공고 선택</h2>
                                <p>선택한 공고 기준으로 면접 시뮬레이션이 설정됩니다.</p>
                            </div>
                            <button type="button" className="modal-close-button" aria-label="닫기" onClick={() => setJobPickerOpen(false)}>×</button>
                        </div>

                        <div className="interview-job-list">
                            {savedJobs.length > 0 ? (
                                savedJobs.map((job) => (
                                    <button
                                        type="button"
                                        key={job.id}
                                        className={`interview-job-option${selectedJob?.id === job.id ? ' is-selected' : ''}`}
                                        onClick={() => {
                                            setSelectedJob(job);
                                            setJobPickerOpen(false);
                                        }}
                                    >
                                        <span>
                                            <strong>{job.company}</strong>
                                            <small>{job.title}</small>
                                        </span>
                                        <em>{job.match}%</em>
                                    </button>
                                ))
                            ) : (
                                <div className="interview-job-empty">관심 공고가 없습니다. 채용공고 페이지에서 관심 공고를 먼저 추가해주세요.</div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

export default InterviewPage;
