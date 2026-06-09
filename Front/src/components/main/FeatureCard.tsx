import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface FeatureCardProps {
    title: string;
    description: string;
    icon: ReactNode;
    to: string;
}

function FeatureCard({ title, description, icon, to }: FeatureCardProps) {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            className="home-feature-card"
            onClick={() => navigate(to)}
        >
            <div className="home-feature-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
        </button>
    );
}

export default FeatureCard;
