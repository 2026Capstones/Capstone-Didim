import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLogo from '../components/layout/AuthLogo';
import InputField from '../components/common/InputField';
import './LoginPage.css';

interface LoginFormState {
    university: string;
    studentId: string;
    password: string;
    keepLogin: boolean;
}

function LoginPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState<LoginFormState>({
        university: '서울대학교',
        studentId: '20241234',
        password: '',
        keepLogin: false,
    });

    const handleInputChange =
        (key: 'university' | 'studentId' | 'password') =>
            (event: ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({
                    ...prev,
                    [key]: event.target.value,
                }));
            };

    const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({
            ...prev,
            keepLogin: event.target.checked,
        }));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        navigate('/home');
    };

    return (
        <main className="login-page">
            <AuthLogo />

            <section className="login-card-section">
                <form className="login-card" onSubmit={handleSubmit}>
                    <h2 className="login-card-title">로그인</h2>

                    <InputField
                        label="대학교"
                        placeholder="대학교를 입력하세요"
                        value={form.university}
                        onChange={handleInputChange('university')}
                        icon={
                            <svg viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M3 10L12 5L21 10L12 15L3 10Z"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M6 11.5V16H18V11.5"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinejoin="round"
                                />
                                <path d="M9 16V12.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                                <path d="M15 16V12.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                            </svg>
                        }
                    />

                    <InputField
                        label="학번"
                        placeholder="학번을 입력하세요"
                        value={form.studentId}
                        onChange={handleInputChange('studentId')}
                        icon={
                            <svg viewBox="0 0 24 24" fill="none">
                                <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
                                <path d="M8 10H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                                <path d="M8 14H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                                <circle cx="16.5" cy="10.2" r="1.1" fill="currentColor" />
                            </svg>
                        }
                    />

                    <InputField
                        label="비밀번호"
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        value={form.password}
                        onChange={handleInputChange('password')}
                        icon={
                            <svg viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M7 10V7.8C7 5.1 9.1 3 12 3C14.9 3 17 5.1 17 7.8V10"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                />
                                <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
                            </svg>
                        }
                    />

                    <div className="login-options-row">
                        <label className="login-keep-label">
                            <input
                                type="checkbox"
                                checked={form.keepLogin}
                                onChange={handleCheckboxChange}
                            />
                            <span>로그인 유지</span>
                        </label>

                        <button type="button" className="login-text-link">
                            비밀번호 찾기
                        </button>
                    </div>

                    <button type="submit" className="login-submit-button">
                        로그인
                        <span aria-hidden="true">→</span>
                    </button>

                    <div className="login-signup-row">
                        <span>아직 계정이 없으신가요?</span>
                        <button type="button" className="login-signup-link">
                            회원가입
                        </button>
                    </div>
                </form>
            </section>

            <p className="login-footer-text">대학생 전용 커리어 플랫폼 · LMS 연동 지원</p>
        </main>
    );
}

export default LoginPage;
