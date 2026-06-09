function SearchBar() {
    return (
        <div className="home-search">
            <span className="home-search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.9" />
                    <path
                        d="M20 20L16.2 16.2"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                    />
                </svg>
            </span>
            <input type="text" placeholder="기업, 직무, 공고 검색..." />
        </div>
    );
}

export default SearchBar;