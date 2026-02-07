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
const headerTitle = document.getElementById('headerTitle');
const headerSubtitle = document.getElementById('headerSubtitle');
// resetBtn moved to header; already referenced below
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
        // Update header to welcome user and expand to full screen
        headerTitle.textContent = `Welcome, ${username}`;
        if (headerSubtitle) headerSubtitle.style.display = 'none';
        document.querySelector('.container')?.classList.add('full-screen');

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

    // Create card layout similar to the Dashboard
    const container = document.createElement('div');
    container.className = 'attendance-cards';

    data.forEach(item => {
        // derive values
        const subjectCode = item.subjectCode || item.subject || '';
        const subjectName = item.subjectName || item.subject || '';
        const present = parseInt(item.present) || 0;
        const total = parseInt(item.classesConducted) || parseInt(item.total) || (present + (parseInt(item.absent) || 0)) || 0;
        const absent = total - present;
        const percentage = total === 0 ? 0 : (present / total) * 100;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.border = '1px solid #e5e7eb';
        card.style.borderRadius = '8px';
        card.style.padding = '12px';
        card.style.background = '#ffffff';
        card.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
        card.style.marginBottom = '10px';

        // header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-start';
        header.style.marginBottom = '8px';

        const titleWrap = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = subjectName || subjectCode;
        title.style.margin = '0';
        title.style.fontSize = '16px';
        title.style.fontWeight = '600';
        const sub = document.createElement('p');
        sub.textContent = subjectCode;
        sub.style.margin = '0';
        sub.style.fontSize = '12px';
        sub.style.color = '#6b7280';

        titleWrap.appendChild(title);
        titleWrap.appendChild(sub);

        const perc = document.createElement('span');
        perc.textContent = `${percentage.toFixed(2)}%`;
        perc.style.fontSize = '20px';
        perc.style.fontWeight = '700';
        if (percentage < 75) perc.style.color = '#dc3545';
        else if (percentage < 85) perc.style.color = '#ff9800';
        else perc.style.color = '#28a745';

        header.appendChild(titleWrap);
        header.appendChild(perc);

        // progress bar
        const progressWrap = document.createElement('div');
        progressWrap.style.width = '100%';
        progressWrap.style.background = '#f3f4f6';
        progressWrap.style.borderRadius = '9999px';
        progressWrap.style.height = '8px';
        progressWrap.style.marginBottom = '8px';

        const progress = document.createElement('div');
        progress.style.height = '8px';
        progress.style.borderRadius = '9999px';
        progress.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        if (percentage < 75) progress.style.background = '#dc3545';
        else if (percentage < 85) progress.style.background = '#ff9800';
        else progress.style.background = '#28a745';

        progressWrap.appendChild(progress);

        // stats
        const stats = document.createElement('div');
        stats.style.display = 'flex';
        stats.style.gap = '16px';
        stats.style.fontSize = '13px';
        stats.style.color = '#6b7280';

        const presentSpan = document.createElement('span');
        presentSpan.innerHTML = `<strong style="color:#16a34a">${present}</strong> Present`;
        const absentSpan = document.createElement('span');
        absentSpan.innerHTML = `<strong style="color:#dc2626">${absent}</strong> Absent`;
        const totalSpan = document.createElement('span');
        totalSpan.innerHTML = `<strong style="color:#111827">${total}</strong> Total Classes`;

        stats.appendChild(presentSpan);
        stats.appendChild(absentSpan);
        stats.appendChild(totalSpan);

        // assemble
        card.appendChild(header);
        card.appendChild(progressWrap);
        card.appendChild(stats);

        container.appendChild(card);
    });

    attendanceTable.innerHTML = '';
    attendanceTable.appendChild(container);
}

function createTd(content) {
    const td = document.createElement('td');
    td.textContent = content;
    return td;
}

// Download button removed per request

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
    // restore header/subtitle and remove full screen
    if (headerTitle) headerTitle.textContent = '🎓 SRM Attendance Scraper';
    if (headerSubtitle) headerSubtitle.style.display = 'block';
    document.querySelector('.container')?.classList.remove('full-screen');
}
