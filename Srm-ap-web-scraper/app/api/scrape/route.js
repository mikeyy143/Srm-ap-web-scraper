import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { username, password } = await req.json();

        // Validate input
        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        console.log(`[${new Date().toLocaleTimeString()}] Starting scrape for user: ${username}`);

        // =========================
        // STEP 1: Launch browser and get JSESSIONID
        // =========================
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        const loginUrl =
            'https://student.srmap.edu.in/srmapstudentcorner/StudentLoginPage';
        await page.goto(loginUrl, { waitUntil: 'networkidle2' });

        const cookies = await page.cookies();
        const jsession = cookies.find((c) => c.name === 'JSESSIONID');
        if (!jsession) throw new Error('JSESSIONID not found');

        const jsessionValue = jsession.value;
        console.log('JSESSIONID obtained');

        // =========================
        // STEP 2: Fetch captcha
        // =========================
        const captchaUrl =
            'https://student.srmap.edu.in/srmapstudentcorner/captchas';

        await page.setCookie({
            name: 'JSESSIONID',
            value: jsessionValue,
            domain: 'student.srmap.edu.in',
            path: '/srmapstudentcorner',
        });

        const captchaResponse = await page.goto(captchaUrl, {
            waitUntil: 'domcontentloaded',
        });

        const captchaBuffer = await captchaResponse.buffer();
        console.log(' Captcha fetched');

        await browser.close();

        // =========================
        // STEP 3: Send captcha to ML model
        // =========================
        console.log('[INFO] Sending captcha to ML model...');

        const formData = new FormData();
        formData.append('file', captchaBuffer, {
            filename: 'captcha.png',
            contentType: 'image/png',
        });

        const captchaSolveResponse = await fetch(
            'http://127.0.0.1:6000/captcha',
            {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders(),
            }
        );

        if (!captchaSolveResponse.ok) {
            throw new Error('Captcha model failed - Make sure the Python API is running on port 6000');
        }

        const ccode = (await captchaSolveResponse.text()).trim();
        console.log(' Captcha solved:', ccode);

        // =========================
        // STEP 4: Login
        // =========================
        console.log(' Attempting login...');

        const loginForm = new URLSearchParams();
        loginForm.append('txtUserName', username);
        loginForm.append('txtAuthKey', password);
        loginForm.append('ccode', ccode);

        const loginResponse = await fetch(
            'https://student.srmap.edu.in/srmapstudentcorner/StudentLoginToPortal',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Cookie: `JSESSIONID=${jsessionValue}`,
                    Referer:
                        'https://student.srmap.edu.in/srmapstudentcorner/StudentLoginPage',
                },
                body: loginForm.toString(),
            }
        );

        const loginHtml = await loginResponse.text();

        if (
            loginHtml.includes('Invalid Captcha') ||
            loginHtml.includes('Invalid Login')
        ) {
            throw new Error('Login failed - Invalid captcha or credentials');
        }

        console.log(' Login successful');

        // =========================
        // STEP 5: Fetch attendance
        // =========================
        console.log(' Fetching attendance report...');

        const reportForm = new URLSearchParams();
        reportForm.append('ids', '3');

        const reportResponse = await fetch(
            'https://student.srmap.edu.in/srmapstudentcorner/students/report/studentreportresources.jsp',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Cookie: `JSESSIONID=${jsessionValue}`,
                    Referer:
                        'https://student.srmap.edu.in/srmapstudentcorner/StudentLoginPage',
                },
                body: reportForm.toString(),
            }
        );

        const reportHtml = await reportResponse.text();
        console.log(' Attendance report fetched');

        // =========================
        // STEP 6: Parse attendance
        // =========================
        console.log('[INFO] Parsing attendance data...');

        const $ = cheerio.load(reportHtml);
        const rows = $('#tblSubjectWiseAttendance tr');
        const attendanceData = [];

        for (const row of rows) {
            const tds = $(row).find('td');
            if (tds.length === 9) {
                // Calculate remaining classes (total - conducted)
                // Note: This assumes that remaining classes can be predicted from course structure
                // Adjust based on actual semester/course data
                const classesConducted = parseInt($(tds[2]).text().trim()) || 0;
                const remainingClasses = 0; // Placeholder - update based on your timetable data

                attendanceData.push({
                    subjectCode: $(tds[0]).text().trim(),
                    subjectName: $(tds[1]).text().trim(),
                    classesConducted: $(tds[2]).text().trim(),
                    present: $(tds[3]).text().trim(),
                    absent: $(tds[4]).text().trim(),
                    od: $(tds[5]).text().trim(),
                    attendancePercent: $(tds[8]).text().trim(),
                    remainingClasses: remainingClasses,
                });
            }
        }

        console.log(`Successfully fetched ${attendanceData.length} subjects`);

        // Return success response
        return NextResponse.json(
            {
                success: true,
                attendanceData,
                captchaInfo: `Captcha solved as: ${ccode}`,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('[ERROR]', error.message);
        return NextResponse.json(
            {
                error: error.message || 'An error occurred during scraping',
            },
            { status: 500 }
        );
    }
}
