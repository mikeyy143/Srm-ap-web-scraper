'use client';

import { useState } from 'react';

export default function LoginForm({ onSubmit, isLoading }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ username, password });
    };

    return (
        <form onSubmit={handleSubmit} className="form-section">
            <div className="form-group">
                <label htmlFor="username">Roll Number:</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., AP2411xxxxxxx"
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                <span>{isLoading ? 'Fetching...' : 'Fetch Attendance'}</span>
                {isLoading && <span className="spinner"></span>}
            </button>
        </form>
    );
}
