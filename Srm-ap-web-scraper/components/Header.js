'use client';

export default function Header({ username, onLogout }) {
    return (
        <div className="header">
            <div>
                <h1>{username ? `Welcome, ${username}` : '🎓 SRM Attendance Scraper'}</h1>
                {!username && <p>Automatically fetch your attendance report</p>}
            </div>

            <div className="header-right">
                {username && (
                    <button className="header-logout" onClick={onLogout}>
                        Log Out
                    </button>
                )}
            </div>
        </div>
    );
}
