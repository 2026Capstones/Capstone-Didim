import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import PortfolioPage from '../pages/PortfolioPage';
import CoverLetterPage from '../pages/CoverLetterPage';
import InterviewPage from '../pages/InterviewPage';
import JobPostingsPage from '../pages/JobPostingsPage';
import MyPage from '../pages/MyPage';
import MyCoverLettersPage from '../pages/MyCoverLettersPage';
import AppLayout from '../components/layout/AppLayout';

const portfolioSectionPattern = /^\/portfolio\/(grades|awards|certificates|activities|projects)$/;

function ScrollToTop() {
    const location = useLocation();

    useEffect(() => {
        if (portfolioSectionPattern.test(location.pathname)) return;

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [location.pathname]);

    return null;
}

function AppRouter() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />

                <Route element={<AppLayout />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/portfolio" element={<PortfolioPage />} />
                    <Route path="/portfolio/:sectionId" element={<PortfolioPage />} />
                    <Route path="/cover-letters" element={<MyCoverLettersPage />} />
                    <Route path="/cover-letters/:id" element={<CoverLetterPage />} />
                    <Route path="/interview" element={<InterviewPage />} />
                    <Route path="/job-postings" element={<JobPostingsPage />} />
                    <Route path="/my-page" element={<MyPage />} />
                    <Route path="/my-cover-letters" element={<Navigate to="/cover-letters" replace />} />
                    <Route path="/cover-letter" element={<Navigate to="/cover-letters" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;
