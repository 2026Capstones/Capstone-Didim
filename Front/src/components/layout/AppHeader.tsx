import { useLocation, useNavigate } from 'react-router-dom';
import ProfileMenu from '../main/ProfileMenu';

function AppHeader() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogoClick = () => {
        if (location.pathname === '/home') {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            return;
        }

        navigate('/home');
    };

    return (
        <header className="app-header">
            <div className="app-header-inner">
                <button type="button" className="app-header-logo" onClick={handleLogoClick}>
                    디딤
                </button>

                <div className="app-header-right">
                    <ProfileMenu />
                </div>
            </div>
        </header>
    );
}

export default AppHeader;
