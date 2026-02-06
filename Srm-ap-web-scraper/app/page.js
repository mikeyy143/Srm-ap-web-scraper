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
    const [captchaInfo, setCaptchaInfo] = useState('');
    const [showForm, setShowForm] = useState(true);

    const handleSubmit = async (credentials) => {
        setIsLoading(true);
        setShowMessage(false);

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
            setCaptchaInfo(result.captchaInfo || 'Solved successfully');
            setShowForm(false);
            showSuccessMessage(
                `✓ Successfully fetched attendance for ${result.attendanceData.length} subjects!`
            );
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage('Network error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!attendanceData) return;

        const dataStr = JSON.stringify(attendanceData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setAttendanceData(null);
        setCaptchaInfo('');
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
        <div className="container">
            <div className="card">
                <Header />

                {showForm ? (
                    <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />
                ) : (
                    <div className="result-section">
                        <AttendanceTable data={attendanceData} captchaInfo={captchaInfo} />

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={handleDownload} className="btn btn-secondary">
                                📥 Download as JSON
                            </button>
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
