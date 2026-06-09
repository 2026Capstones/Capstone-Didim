import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ProfileMenu() {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const moveTo = (path: string) => {
        if (path === '/login') {
            window.localStorage.removeItem('didim:portfolio-sync-state');
            window.localStorage.removeItem('token'); // 로그아웃 시 토큰 삭제 추가
            // 필요한 경우 window.localStorage.clear(); 를 사용하여 전부 초기화할 수도 있습니다.
        }

        setOpen(false);
        navigate(path);
    };

    return (
        <div className="profile-menu" ref={menuRef}>
            <button
                type="button"
                className="profile-menu-trigger"
                aria-label="마이페이지 메뉴 열기"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
            >
                <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                        <path
                            d="M6.5 18.2C7.4 15.8 9.4 14.5 12 14.5C14.6 14.5 16.6 15.8 17.5 18.2"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                </span>
            </button>

            {open && (
                <div className="profile-menu-dropdown">
                    <button type="button" className="profile-menu-item" onClick={() => moveTo('/my-page')}>
                        마이페이지
                    </button>
                    <button type="button" className="profile-menu-item" onClick={() => moveTo('/admin')}>
                        관리자 페이지
                    </button>
                    <button type="button" className="profile-menu-item danger" onClick={() => moveTo('/login')}>
                        로그아웃
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProfileMenu;
