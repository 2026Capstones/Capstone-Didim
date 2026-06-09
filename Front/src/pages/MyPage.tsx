import { Link } from 'react-router-dom';
import { userProfile } from '../mocks/career';
import './CoverLetters.css';

function MyPage() {
    return (
        <section className="simple-page">
            <div className="simple-page-header">
                <div className="page-breadcrumb-title">
                    <Link to="/home">‹ 메인으로</Link>
                    <span>/</span>
                    <h1>마이페이지</h1>
                </div>
                <p>계정 정보와 학교 연동 상태를 확인합니다.</p>
            </div>
            <div className="simple-card-grid">
                <article className="simple-card">
                    <h3>{userProfile.name}</h3>
                    <p>{userProfile.department} · {userProfile.grade}</p>
                    <p>희망 직무: {userProfile.targetRole}</p>
                </article>
                <article className="simple-card">
                    <h3>학교 LMS 연동</h3>
                    <p>아직 동기화 전입니다. 포트폴리오 페이지에서 학교 정보를 가져올 수 있습니다.</p>
                    <button type="button" className="primary-action-button">동기화 시작</button>
                </article>
            </div>
        </section>
    );
}

export default MyPage;
