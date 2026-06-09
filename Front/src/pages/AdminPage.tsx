import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './CoverLetters.css'; // 기존 스타일 재활용

interface JobPosting {
    jobId: string;
    companyName: string;
    jobTitle: string;
    deadline: string;
}

function AdminPage() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [uploading, setUploading] = useState(false);

    const fetchJobs = async () => {
        try {
            const response = await fetch('/api/admin/job-posting', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            if (response.ok) {
                const data = await response.json();
                setJobs(data.data || []);
            }
        } catch (error) {
            console.error('Fetch admin jobs error:', error);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/admin/job-posting/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData
            });

            if (response.ok) {
                alert('공고 업로드 및 AI 파싱 완료!');
                fetchJobs();
            } else {
                alert('업로드 실패');
            }
        } catch (error) {
            console.error('Admin upload error:', error);
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/admin/job-posting/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            if (response.ok) {
                fetchJobs();
            }
        } catch (error) {
            console.error('Delete job error:', error);
        }
    };

    return (
        <section className="simple-page admin-page">
            <div className="simple-page-header">
                <div className="page-breadcrumb-title">
                    <Link to="/home">‹ 메인으로</Link>
                    <span>/</span>
                    <h1>관리자 대시보드</h1>
                </div>
                <p>채용 공고 PDF를 업로드하면 AI가 자동으로 직무와 요건을 분석하여 등록합니다.</p>
            </div>

            <div style={{ marginBottom: '2rem', padding: '2rem', border: '2px dashed #ddd', borderRadius: '12px', textAlign: 'center' }}>
                <input
                    type="file"
                    id="admin-upload"
                    hidden
                    onChange={handleFileUpload}
                    accept=".pdf"
                />
                <label htmlFor="admin-upload" className="primary-action-button" style={{ cursor: 'pointer', display: 'inline-block' }}>
                    {uploading ? 'AI 분석 중...' : '새 채용 공고 PDF 업로드'}
                </label>
            </div>

            <div className="portfolio-section-card">
                <div className="portfolio-section-head">
                    <div className="portfolio-section-title"><strong>등록된 공고 관리</strong><span>{jobs.length}건</span></div>
                </div>
                <div className="portfolio-list">
                    {jobs.map((job) => (
                        <article key={job.jobId} className="portfolio-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong>{job.companyName}</strong>
                                <p>{job.jobTitle} (마감: {job.deadline})</p>
                            </div>
                            <button
                                type="button"
                                className="secondary-action-button"
                                style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
                                onClick={() => handleDelete(job.jobId)}
                            >
                                삭제
                            </button>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default AdminPage;
