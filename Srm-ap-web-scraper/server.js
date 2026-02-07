import express from 'express';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.post('/scrape', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        .log(`[${new Date().toLocaleTimeString()}] Starting scrape for user: ${username}`);

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
        .log('[INFO] JSESSIONID obtained');

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
        .log('[INFO] Captcha fetched');

        await browser.close();

        // =========================
        // STEP 3: Send captcha to ML model
        // =========================
        .log('[INFO] Sending captcha to ML model...');

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
            throw new Error('Captcha model failed');
        }

        const ccode = (await captchaSolveResponse.text()).trim();
        

        // =========================
        // STEP 4: Login
        // =========================
        

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

    

        // =========================
        // STEP 5: Fetch attendance
        // =========================


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
       

        // =========================
        // STEP 6: Parse attendance
        // =========================
        

        const $ = cheerio.load(reportHtml);
        const rows = $('#tblSubjectWiseAttendance tr');
        const attendanceData = [];

        for (const row of rows) {
            const tds = $(row).find('td');
            if (tds.length === 9) {
                attendanceData.push({
                    subjectCode: $(tds[0]).text().trim(),
                    subjectName: $(tds[1]).text().trim(),
                    classesConducted: $(tds[2]).text().trim(),
                    present: $(tds[3]).text().trim(),
                    attendancePercent: $(tds[8]).text().trim(),
                });
            }
        }



        // Return success response
        res.json({
            success: true,
            attendanceData,
            captchaInfo: `Captcha solved as: ${ccode}`,
        });

    } catch (error) {
        console.error('[ERROR]', error.message);
        res.status(500).json({
            error: error.message || 'An error occurred during scraping',
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   SRM Attendance Scraper UI Server        ║
║   Server running at:                      ║
║   👉 http://localhost:${PORT}                    ║
╚════════════════════════════════════════════╝
  `);
    console.log('Make sure the Python API is running on port 6000!');
});
