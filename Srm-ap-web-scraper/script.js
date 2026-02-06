// Form elements
const loginForm = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const spinner = document.getElementById('spinner');
const formContainer = document.getElementById('formContainer');
const messageContainer = document.getElementById('messageContainer');
const message = document.getElementById('message');
const resultContainer = document.getElementById('resultContainer');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const captchaInfo = document.getElementById('captchaInfo');
const captchaStatus = document.getElementById('captchaStatus');
const attendanceTable = document.getElementById('attendanceTable');

let currentAttendanceData = null;

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Fetching...';

    try {
        const response = await fetch('/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            showMessage(result.error || 'An error occurred', 'error');
            resetForm();
            return;
        }

        // Success
        currentAttendanceData = result.attendanceData;
        captchaStatus.textContent = result.captchaInfo || 'Solved successfully';
        captchaInfo.style.display = 'block';

        displayAttendanceTable(result.attendanceData);

        formContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        showMessage(`✓ Successfully fetched attendance for ${result.attendanceData.length} subjects!`, 'success');

    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error: ' + error.message, 'error');
        resetForm();
    }
});

function showMessage(msg, type = 'info') {
    message.textContent = msg;
    message.className = `message ${type}`;
    messageContainer.style.display = 'block';
}

function displayAttendanceTable(data) {
    if (!data || data.length === 0) {
        attendanceTable.innerHTML = '<p>No attendance data found.</p>';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create header
    const headerRow = document.createElement('tr');
    const headers = ['Subject Code', 'Subject Name', 'Classes', 'Present', 'Attendance %'];

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);

    // Create body rows
    data.forEach(item => {
        const row = document.createElement('tr');

        row.appendChild(createTd(item.subjectCode));
        row.appendChild(createTd(item.subjectName));
        row.appendChild(createTd(item.classesConducted));
        row.appendChild(createTd(item.present));

        const attendanceTd = createTd(item.attendancePercent);
        const attendanceValue = parseFloat(item.attendancePercent);

        // Color code the attendance percentage
        if (attendanceValue < 75) {
            attendanceTd.style.color = '#dc3545';
            attendanceTd.style.fontWeight = 'bold';
        } else if (attendanceValue < 85) {
            attendanceTd.style.color = '#ff9800';
            attendanceTd.style.fontWeight = 'bold';
        } else {
            attendanceTd.style.color = '#28a745';
            attendanceTd.style.fontWeight = 'bold';
        }

        row.appendChild(attendanceTd);
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    attendanceTable.innerHTML = '';
    attendanceTable.appendChild(table);
}

function createTd(content) {
    const td = document.createElement('td');
    td.textContent = content;
    return td;
}

// Download as JSON
downloadBtn.addEventListener('click', () => {
    if (!currentAttendanceData) return;

    const dataStr = JSON.stringify(currentAttendanceData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
});

// Reset button
resetBtn.addEventListener('click', () => {
    resetForm();
});

function resetForm() {
    loginForm.reset();
    formContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    messageContainer.style.display = 'none';
    submitBtn.disabled = false;
    spinner.style.display = 'none';
    btnText.textContent = 'Fetch Attendance';
    currentAttendanceData = null;
}
