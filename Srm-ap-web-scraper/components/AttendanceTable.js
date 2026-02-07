'use client';

import React from 'react';

const calculateAttendanceMetrics = (present, absent, od) => {
    const P = parseInt(present) || 0;
    const A = parseInt(absent) || 0;
    const OD = parseInt(od) || 0;
    const T = P + A + OD;

    if (T === 0) {
        return {
            percentage: 0,
            status: 'none',
            message: 'No classes conducted yet',
        };
    }

    const percentage = (P / T) * 100;

    if (percentage < 75) {
        const mustAttend = Math.max(0, Math.ceil(3 * A + 3 * OD - P));
        return {
            percentage,
            status: 'low',
            message: `Must attend ${mustAttend} more classes`,
        };
    } else {
        return {
            percentage,
            status: 'safe',
            message: 'Safe to Bunk',
        };
    }
};

export default function AttendanceTable({ data }) {
    if (!data || data.length === 0) {
        return <p className="text-center text-muted-foreground">No attendance data found.</p>;
    }

    return (
        <div className="w-full px-6 py-6">
            {/* captcha status removed */}

            <h2 className="text-lg font-semibold mb-4">Subject-wise Attendance</h2>

            <div className="space-y-4">
                {data.map((item, index) => {
                    const metrics = calculateAttendanceMetrics(item.present, item.absent, item.od || 0);

                    return (
                        <div key={index} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-medium">{item.subjectName}</h3>
                                    <p className="text-xs text-muted-foreground">{item.subjectCode}</p>
                                </div>

                                <span className={`text-2xl font-bold ${metrics.percentage >= 75 ? 'text-green-500' : metrics.percentage >= 60 ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                    {metrics.percentage.toFixed(2)}%
                                </span>
                            </div>

                            <div className="w-full bg-muted rounded-full h-2 mb-3">
                                <div
                                    className={`h-2 rounded-full ${metrics.percentage >= 75 ? 'bg-green-500' : metrics.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min(100, Math.max(0, metrics.percentage))}%` }}
                                />
                            </div>

                            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                                <span>
                                    <strong className="text-green-500">{item.present}</strong> Present
                                </span>
                                <span>
                                    <strong className="text-red-500">{item.absent}</strong> Absent
                                </span>
                                <span>
                                    <strong>{(parseInt(item.present) || 0) + (parseInt(item.absent) || 0) + (parseInt(item.od) || 0)}</strong> Total
                                </span>
                            </div>

                            <p className={`mt-2 text-sm font-medium ${metrics.status === 'low' ? 'text-red-500' : 'text-green-500'}`}>
                                {metrics.message}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Overall attendance removed per request */}
        </div>
    );
}
