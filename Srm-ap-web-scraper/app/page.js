'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import LoginForm from '@/components/LoginForm';
import AttendanceTable from '@/components/AttendanceTable';
import Message from '@/components/Message';

export default function Home() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessage, setShowMessage] = useState(false);
    const [attendanceData, setAttendanceData] = useState(null);
    const [username, setUsername] = useState('');
    const [showForm, setShowForm] = useState(true);

    const handleSubmit = async (credentials) => {
        setIsLoading(true);
        setShowMessage(false);
        setUsername(credentials.username || '');

        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const result = await response.json();

            if (!response.ok) {
                showErrorMessage(result.error || 'An error occurred');
                return;
            }

            // Success
            setAttendanceData(result.attendanceData);
            setShowForm(false);
            showSuccessMessage(`✓ Successfully fetched attendance for ${result.attendanceData.length} subjects!`);
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage('Network error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Download handler removed per request

    const handleReset = () => {
        setAttendanceData(null);
        setUsername('');
        setShowForm(true);
        setShowMessage(false);
    };

    const showSuccessMessage = (msg) => {
        setMessage(msg);
        setMessageType('success');
        setShowMessage(true);
    };

    const showErrorMessage = (msg) => {
        setMessage(msg);
        setMessageType('error');
        setShowMessage(true);
    };

    return (
        <div className={`container ${!showForm ? 'full-screen' : ''}`}>
            <div className="card">
                <Header username={username} onLogout={handleReset} />

                {showForm ? (
                    <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />
                ) : (
                    <div className="result-section">
                        <AttendanceTable data={attendanceData} />

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={handleReset} className="btn btn-secondary">
                                Log Out
                            </button>
                        </div>
                    </div>
                )}

                <Message
                    message={message}
                    type={messageType}
                    show={showMessage}
                />
            </div>
        </div>
    );
}
