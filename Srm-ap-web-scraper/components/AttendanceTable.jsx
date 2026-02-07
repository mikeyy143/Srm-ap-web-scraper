'use client';

import React from 'react';

/* ---------- Attendance Logic ---------- */
const calculateAttendanceMetrics = (present, absent) => {
    const P = parseInt(present) || 0;
    const A = parseInt(absent) || 0;
    const T = P + A;

    if (T === 0) {
        return {
            percentage: 0,
            status: 'none',
            message: 'No classes conducted yet',
        };
    }

    const percentage = (P / T) * 100;

    if (percentage < 75) {
        const mustAttend = Math.max(0, Math.ceil(3 * T - 4 * P));
        return {
            percentage,
            status: 'low',
            message: `Must attend ${mustAttend} classes`,
        };
    } else {
        const canBunk = Math.max(0, Math.floor(P / 0.75 - T));
        return {
            percentage,
            status: 'safe',
            message: `Can bunk ${canBunk} classes`,
        };
    }
};

/* ---------- UI Helpers ---------- */
const getPercentageColor = (percentage) => {
    if (percentage >= 75) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
};

const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
};

/* ---------- Component ---------- */
export default function AttendanceDashboard({ data }) {
    if (!data || data.length === 0) {
        return <p className="text-center text-muted-foreground">No attendance data found.</p>;
    }


    return (
        <div className="w-full px-6 py-6">
            {/* captcha status removed */}

            <h2 className="text-lg font-semibold mb-4">Subject-wise Attendance</h2>

            <div className="space-y-4">
                {data.map((item, index) => {
                    const metrics = calculateAttendanceMetrics(item.present, item.absent);

                    return (
                        <div
                            key={index}
                            className="bg-card border border-border rounded-lg p-4 shadow-sm"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-medium">{item.subjectName}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {item.subjectCode}
                                    </p>
                                </div>

                                <span
                                    className={`text-2xl font-bold ${getPercentageColor(
                                        metrics.percentage
                                    )}`}
                                >
                                    {metrics.percentage.toFixed(2)}%
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-muted rounded-full h-2 mb-3">
                                <div
                                    className={`h-2 rounded-full ${getProgressColor(
                                        metrics.percentage
                                    )}`}
                                    style={{ width: `${metrics.percentage}%` }}
                                />
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                                <span>
                                    <strong className="text-green-500">{item.present}</strong> Present
                                </span>
                                <span>
                                    <strong className="text-red-500">{item.absent}</strong> Absent
                                </span>
                                <span>
                                    <strong>{item.present + item.absent}</strong> Total
                                </span>
                            </div>

                            {/* Bunk / Must Attend */}
                            <p
                                className={`mt-2 text-sm font-medium ${metrics.status === 'low'
                                    ? 'text-red-500'
                                    : 'text-green-500'
                                    }`}
                            >
                                {metrics.message}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Overall attendance removed */}
        </div>
    );
}
