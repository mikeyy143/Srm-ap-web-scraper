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

export default function AttendanceTable({ data, captchaInfo }) {
    if (!data || data.length === 0) {
        return <p>No attendance data found.</p>;
    }

    return (
        <>
            {captchaInfo && (
                <div className="captcha-info">
                    <p>
                        <strong>Captcha Status:</strong> {captchaInfo}
                    </p>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Subject Code</th>
                            <th>Subject Name</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>OD/Medical</th>
                            <th>Attendance %</th>
                            <th>Bunks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => {
                            const metrics = calculateAttendanceMetrics(
                                item.present,
                                item.absent,
                                item.od || 0
                            );

                            const attendanceColor =
                                metrics.percentage < 75
                                    ? '#dc3545'
                                    : metrics.percentage < 85
                                        ? '#ff9800'
                                        : '#28a745';

                            return (
                                <tr key={index}>
                                    <td>{item.subjectCode}</td>
                                    <td>{item.subjectName}</td>
                                    <td>{item.present}</td>
                                    <td>{item.absent}</td>
                                    <td>{item.od || 0}</td>
                                    <td
                                        style={{
                                            color: attendanceColor,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {metrics.percentage.toFixed(2)}%
                                    </td>
                                    <td
                                        style={{
                                            fontWeight: 'bold',
                                            color:
                                                metrics.status === 'low'
                                                    ? '#dc3545'
                                                    : '#28a745',
                                        }}
                                    >
                                        {metrics.message}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}
