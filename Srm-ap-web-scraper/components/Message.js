'use client';

export default function Message({ message, type = 'info', show = false }) {
    if (!show) return null;

    return (
        <div className="message-section">
            <div className={`message ${type}`}>{message}</div>
        </div>
    );
}
