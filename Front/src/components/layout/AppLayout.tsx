import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

function AppLayout() {
    return (
        <div className="app-shell">
            <AppHeader />
            <main className="app-shell-content">
                <Outlet />
            </main>
        </div>
    );
}

export default AppLayout;