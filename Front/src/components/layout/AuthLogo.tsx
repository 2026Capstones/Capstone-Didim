function AuthLogo() {
    return (
        <div className="login-brand-block">
            <div className="login-brand-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                    <path
                        d="M3 9.5L12 5L21 9.5L12 14L3 9.5Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M7 11.5V15.2C7 15.2 8.8 17 12 17C15.2 17 17 15.2 17 15.2V11.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M21 9.5V14"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            <h1 className="login-brand-title">디딤</h1>
            <p className="login-brand-subtitle">LMS 계정으로 로그인하세요</p>
        </div>
    );
}

export default AuthLogo;